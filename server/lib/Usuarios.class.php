<?php
	class Usuarios
	{
		private $sql;
		
		public $id;
		public $nome;
		public $login;
		public $perfil_id;
		public $filial_id;
		public $filial_nome;
		public $filial_id_admin;
		public $administrador;
		
		public function __construct(){
			$this->sql = new Connection();
			if (!session_id()) session_start();
		}
		
		public function getIp(){
			$ip = (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown');
			$forward = (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : false);
			
			return (($ip=='unknown' && $forward != 'unknown' ) ? $forward : $ip); 
		}
		
		public function isLogado(){	
			if( isset($_SESSION['SESSION_USUARIO'])){	
				$sessao = unserialize($_SESSION['SESSION_USUARIO']);
				
				if(!empty($sessao)){
					$this->id = $sessao['id'];
					$this->nome = $sessao['nome'];
					$this->login = $sessao['login'];
					$this->perfil_id = $sessao['perfil_id'];
					$this->filial_id = $sessao['filial_id'];
					$this->filial_nome = $sessao['filial_nome'];
					$this->filial_id_admin = $sessao['filial_id_admin'];
					$this->administrador = $sessao['administrador'];
					return true;
				}
				else
				{
					return false;
				}
			} 
			else{
				return false;
			}
		}
		
		public function setLogar($usuario, $senha){
			try{
				if(empty($usuario) or empty($senha)){
					return json_encode(array(
						'success'	=> false,
						'msg'		=> utf8_encode('Login e Senha obrigat�rios!')
					));
				}
				else{
					$this->login = $usuario;
					$senha = md5(trim(rtrim($senha)));
					
					$query = $this->sql->prepare("
						SELECT u.*, f.filial FROM usuarios as u
						LEFT JOIN filial as f ON (u.filial_id=f.id)
						WHERE login = ? AND senha = ?
					");
					
					$query->execute(array(
						$usuario,
						$senha
					));

					if($query->rowCount() > 0){
						$result = $query->fetch(PDO::FETCH_OBJ);
						
						if($result->status == '1'){
							$sessao = array();
							if($result->administrador=='1'){
								$admin = true;
							}
							else{
								$admin = false;
							}
							
							$sessao['id'] = $result->id;
							$sessao['nome'] = $result->nome;
							$sessao['login'] = $result->login;
							$sessao['perfil_id'] = $result->perfil_id;
							$sessao['filial_id'] = $result->filial_id;
							$sessao['filial_nome'] = $result->filial;
							
							$this->id = $result->id;
							$this->perfil_id = $result->perfil_id;
							
							if($result->filial_id=='0'){
								$sessao['filial_id_admin'] = 1;
							}	
							else{
								$sessao['filial_id_admin'] = 0;
							}
							$sessao['administrador'] = $admin;
							
							$_SESSION['SESSION_USUARIO'] = serialize($sessao);
							if($admin==false){
								$this->getModulos();
							}
							else{
								$this->getModulosAdmin();
							}
							
							return json_encode(array(
								'success'	=> true,
								'msg'		=>	"Sucess!"
							));
						}
						else{
							return json_encode(array(
								'success'	=> false,
								'msg'		=>	utf8_encode('Usu�rio bloqueado!')
							));
						}
					}
					else
					{
						return json_encode(array(
							'success'	=> false,
							'msg'		=> utf8_encode('Usu�rio e senha incorretos!')
						));
					}
				}
			}
			catch(PDOException $e){
				return json_encode(array(
					'success'	=> false,
					'msg'		=> utf8_encode($e->getMessage())
				));
			}
		}
		
		public function setLogout(){
			if($this->isLogado())
			{
				unset($_SESSION['SESSION_USUARIO']);
				unset($_SESSION['MODEL_PERMISSOES']);
				unset($_SESSION['MODEL_TABLES']);
				session_destroy();
			}
		}
		
		public function getAcao($tabela, $action){
			$sessao = unserialize($_SESSION['SESSION_USUARIO']);
			if($sessao['administrador']==false){
				$models = unserialize($_SESSION['MODEL_PERMISSOES']);
				$res = false;
				if(isset($models[$tabela])){
					
					foreach($models[$tabela] as $row){
						if($row['acao']==$action){
							$res = true;
						}
					}
				}
				
				if($res==false){
					die(json_encode(array(
						'success'	=> false,
						'msg'		=> utf8_encode("Permiss�es Insuficientes!"),
						'dados'		=> array()
					)));
				}
			}	
		}
	
		public function getModulos(){
			try{
				$query = $this->sql->prepare("
					SELECT ma.modulo_id, m.modulo, m.descricao, pp.acao_id, ma.acao, 'S' as acesso
					FROM permissoes_perfil as pp
					INNER JOIN modulos_acoes as ma ON (pp.acao_id=ma.id)
					INNER JOIN modulos as m ON (ma.modulo_id=m.id)
					WHERE pp.perfil_id = ?

					UNION ALL
					
					SELECT mac.modulo_id, mm.modulo, mm.descricao,
					pu.acao_id, mac.acao, pu.acesso
					FROM permissoes_usuario as pu
					INNER JOIN modulos_acoes as mac ON (pu.acao_id=mac.id)
					INNER JOIN modulos as mm ON (mac.modulo_id=mm.id)
					WHERE pu.usuario_id = ?
				");
				
				$query->execute(array(
					$this->perfil_id,
					$this->id
				));
				
				$result = $query->fetchAll(PDO::FETCH_OBJ);
				
				$response = $this->prepareModulos($result);
				
				$this->models = $response;
				$_SESSION['MODEL_PERMISSOES'] = serialize($response);
				return true;
			}
			catch(PdoException $e){
				$this->models = array();
				$_SESSION['MODEL_PERMISSOES'] = serialize(array());
				die(json_encode(array(
					'success'=> false,
					'msg'=> $e->getMessage()
				)));
				return false;
			}
		}
		
		public function getModulosAdmin(){
			try{
				$query = $this->sql->prepare("
					SELECT m.id as modulo_id, m.modulo, m.descricao,
					ma.id as acao_id, ma.acao, 'S' as acesso
					FROM modulos as m INNER JOIN modulos_acoes as ma
					ON (m.id=ma.modulo_id)
				");
				
				$query->execute();
				
				$result = $query->fetchAll(PDO::FETCH_OBJ);
				
				$response = $this->prepareModulos($result, true);
				$this->models = $response;
				$_SESSION['MODEL_PERMISSOES'] = serialize($response);
				return true;
			}
			catch(PDOException $e){
				$this->models = array();
				$_SESSION['MODEL_PERMISSOES'] = serialize(array());
				die(json_encode(array(
					'success'=> false,
					'msg'=> $e->getMessage()
				)));
				return false;
			}
		}
		
		public function prepareModulos($result, $admin=false){
			$data = array();
			$tables = array();
			foreach($result as $row1){
				$not_add = false;
				if($admin==false){
					foreach($result as $row2){
						if(	($row1->modulo_id==$row2->modulo_id) and
							($row1->acao_id==$row2->acao_id) and 
							($row1->acesso!=$row2->acesso)){
							$not_add = true;
						}
					}
				}
				if($not_add==false){
					if($row1->acesso=='S'){
						$tables[$row1->modulo] = array(
							'descricao'	=> $row1->descricao,
							'modulo'	=> $row1->modulo
						);
						
						$data[$row1->modulo][] = array(
							'descricao'	=> $row1->descricao,
							'modulo'	=> $row1->modulo,
							'acao'		=> $row1->acao,
							'acao_id'	=> $row1->acao_id
						);
					}
				}
			}

			$_SESSION['MODEL_TABLES'] = serialize($tables);
			return $data;
		}
		
		public function setUpper($tabela){
			$tab = explode('_', $tabela);
			if(count($tab)==1){
				$tab = explode('-', $tabela);
				if(count($tab)==1){
					$tab = ucfirst($tabela);
				}
				else{
					$r = array();
					foreach ($tab as $key){
						$r[] = ucfirst($key);
					}
					$tab = implode('-', $r);
				}
			}
			else{
				$r = array();
				foreach ($tab as $key){
					$r[] = ucfirst($key);
				}
				$tab = implode('_', $r);
			}
			
			return $tab;
		}
		
		public function getMenu(){
			$json = array_values(unserialize($_SESSION['MODEL_TABLES']));
			$data = array();
			foreach($json as $row){
				$data[] = array(
					'text'		=> $row['descricao'],
					'leaf'		=> true,
					'iconCls' 	=> strtolower($row['modulo']),
					'tipo'		=> 'list',
					'idtemp'	=> "listagem_".strtolower($row['modulo']),
					'tab'		=> strtolower($row['modulo'])
				);
			}

			if(($this->filial_id_admin==1) or ($this->administrador==true)){
				$data[] = array(
					'text'		=> "Filial",
					'leaf'		=> true,
					'iconCls' 	=> 'filial',
					'tipo'		=> 'list',
					'idtemp'	=> "listagem_filial",
					'tab'		=> "filial"
				);
			}
			
			return json_encode(array('children'=>$data));
		}
		
		public function getAllModels(){
			try{
				$query = $this->sql->prepare("
					SELECT ma.modulo_id, m.modulo, m.descricao, ma.id as acao_id, ma.acao
					FROM modulos_acoes as ma
					INNER JOIN modulos as m ON (ma.modulo_id=m.id)
				");
			
				$query->execute(array(
						$this->perfil_id
				));
				$result = $query->fetchAll(PDO::FETCH_OBJ);
				return $this->prepareModulosTree($result);			
			}
			catch(PdoException $e){
				die(json_encode(array(
					'success'=> false,
					'msg'=> $e->getMessage()
				)));
				return false;
			}
		}
		
		public function prepareModulosTree($result){
			$data = array();
			$tables = array();
			foreach($result as $row1){
				$data[$row1->modulo][] = array(
					'text'			=> $row1->acao,
					'modulo'		=> $row1->modulo,
					'leaf'			=> false,
					'acao'			=> $row1->acao,
					'checked'		=> false,
					'init_checked'	=> false
				);
			}
			return $data;
		}

		public function getMenuInicializar(){
			$menu = $this->getMenu();
			$menu = json_decode($menu, true);
			$images = array();

			foreach($menu['children'] as $row){
				
				$images[] = array(
					'id' => strtolower($row['iconCls']),
					'modulo' => strtolower($row['iconCls']),
					'src' => 'resources/images/' . strtolower($row['iconCls']) . '48x48.png',
					'descricao' => $row['text']
				);
			}
			return json_encode(array('dados'=> $images));
		}
		
		public function getTree(){
			$permissoes = unserialize($_SESSION['MODEL_PERMISSOES']);
			$result = array();
			$data = array();
			$tabela = "";
			$total = 0;
			$modulos = $this->getAllModels();
			//print_r($modulos);
			foreach($modulos as $key => $row){
				$data = array();
				$tabela = $key;
				if($permissoes[$key]){
					foreach($row as $r1){
						$check = false;
						foreach($permissoes[$key] as $r2){
							if(($r2['acao']==$r1['acao']) and ($r2['modulo']==$r1['modulo'])){
								$check = true;
							}
						}
						if($check==true){
							$r1['checked'] = true;
							$r1['init_checked'] = true;
							$r1['leaf'] = true;
							$data[] = $r1;
						}
						else{
							$data[] = $r1;
						}
					}
				}
				else{
					foreach($row as $r1){
						$data[] = $r1;
					}
				}
				
				$result[] = array(
					'text'		=> $this->setUpper($tabela),
					'leaf'		=> false,
					'children' 	=> $data
				);
			}		

			return json_encode(array('children'=>$result));
		}
	
	}
?>