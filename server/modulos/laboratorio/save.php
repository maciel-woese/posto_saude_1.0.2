<?php
/**
*	@Autor: Maciel Sousa
*	@Email: macielcr7@gmail.com
**/

if($_POST){
	require('../../autoLoad.php');
	$tabela = 'laboratorio';
	try {
		
		$connection->beginTransaction();
		
		if($_POST['action'] == 'EDITAR'){
		
			$user->getAcao($tabela, 'editar');
		
			$pdo = $connection->prepare("
					UPDATE laboratorio SET 
							laboratorio = ?							
 					WHERE id = ?
			");
			$params = array(
				$_POST['laboratorio'],
				$_POST['id']
			);
		}
		else if ($_POST['action'] == 'INSERIR'){
		
			$user->getAcao($tabela, 'adicionar');
		
			$pdo = $connection->prepare("
				INSERT INTO laboratorio 
					(
						laboratorio						
					) 
				VALUES 
					(
						?			
					)
			");
			$params = array(
				$_POST['laboratorio']		
			);
		}
		else{
			throw new PDOException(utf8_encode(ACTION_NOT_FOUND));
		}
		
		$pdo->execute($params);
				
		$connection->commit();
		echo json_encode(array('success'=>true, 'msg'=>SAVED_SUCCESS));
	}
	catch (PDOException $e) {
		$connection->rollBack();
		echo json_encode(array('success'=>false, 'msg'=>ERROR_SAVE_DATA, 'erro'=>$e->getMessage()));
	}
}