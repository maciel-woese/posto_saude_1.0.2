/**
*	@Autor: Maciel Sousa
*	@Email: macielcr7@gmail.com
**/

Ext.define('ShSolutions.controller.Usuarios', {
    extend: 'Ext.app.Controller',
	mixins: {
        controls: 'ShSolutions.controller.Util'
    },
	
	storePai: true,
	tabela: 'Usuarios',

	refs: [
        {
        	ref: 'list',
        	selector: 'usuarioslist'
        },
        {
        	ref: 'form',
        	selector: 'addusuarioswin form'
        },
        {
        	ref: 'filterBtn',
        	selector: 'usuarioslist button[action=filtrar]'
        },
        {
        	ref: 'filterWin',
        	selector: 'filterusuarioswin'
        },
        {
        	ref: 'filterForm',
        	selector: 'filterusuarioswin form'
        },
        {
        	ref: 'addWin',
        	selector: 'addusuarioswin'
        }
    ],
	
    models: [
		'ModelComboLocal',
		'ModelCombo',
		'ModelUsuarios'
	],
	stores: [
		'StoreComboPerfil',
		'StoreComboUsuarios',
		'StoreComboAdministradorUsuarios',
		'StoreComboStatusUsuarios',
		'StoreUsuarios'		
	],
	
    views: [
        'usuarios.List',
        'usuarios.Filtro',
        'usuarios.Senha',
        'usuarios.Edit'
    ],

    init: function(application) {
    	this.control({
    		'usuarioslist': {
                itemdblclick: this.edit,
				afterrender: this.getPermissoes,
                render: this.gridLoad
            },
            'usuarioslist button[action=filtrar]': {
            	click: this.btStoreLoadFielter
            },
            'usuarioslist button[action=adicionar]': {
                click: this.add
            },
            'usuarioslist button[action=editar]': {
                click: this.btedit
            },
            'usuarioslist button[action=deletar]': {
                click: this.btdel
            },            
            'usuarioslist button[action=gerar_pdf]': {
                click: this.gerarPdf
            },
            'usuarioslist button[action=modulos]': {
                click: this.setModulos
            },
            'addusuarioswin button[action=salvar]': {
                click: this.update
            },
            'addusuarioswin button[action=resetar]': {
                click: this.reset
            },
            'addusuarioswin form fieldcontainer combobox': {
                change: this.enableButton,
				render: this.comboLoad
            },
            'addusuarioswin form fieldcontainer button[action=reset_combo]': {
                click: this.resetCombo
            },
			'addusuarioswin form fieldcontainer button[action=add_win]': {
                click: this.getAddWindow
            },
			
			'addsenhawin button[action=salvar]': {
                click: this.updateSenha
            },
			
            'filterusuarioswin form fieldcontainer combobox': {
                change: this.enableButton,
				render: this.comboLoad
            },
            'filterusuarioswin button[action=resetar_filtro]': {
                click: this.resetFielter
            },
            'filterusuarioswin button[action=filtrar_busca]': {
                click: this.setFielter
            },
            'filterusuarioswin': {
                show: this.filterSetFields
            }
        });
    },
	
    setModulos: function(button){
    	if (this.getList().selModel.hasSelection()) {
			var record = this.getList().getSelectionModel().getLastSelected();
			
	    	if(record.get('administrador')==true){
	    		info('Aviso!', 'Adiministradores tem permiss&otilde;es totais!');
	    		return true;
	    	}
	    	
	    	var win = Ext.getCmp('AddPermissoesWin');
	    	if(!win) win = Ext.widget('addpermissoeswin');
	    	win.show();
	    	Ext.getCmp('TreePermissoes').store.proxy.extraParams = {
    			action: 'USUARIO',
	    		usuario_id: record.get('id'),
    			perfil_id: record.get('perfil_id')
    		};
	    	
	    	Ext.getCmp('TreePermissoes').store.load();
	    	
		}
		else{
			info(this.titleErro, this.editErroGrid);
			return true;
		}
    	
    },
    
    gerarPdf: function(button){
		var me = this;
		window.open('server/modulos/usuarios/pdf.php?'+
			Ext.Object.toQueryString(me.getList().store.proxy.extraParams)
		);
	},
	
    edit: function(grid, record) {
    	var me = this;
		var win = Ext.getCmp('AddUsuariosWin');
        if(!win) win = Ext.widget('addusuarioswin');
        win.show();
        win.setTitle('Edi&ccedil;&atilde;o de Usu&aacute;rios');
		
    	me.getValuesForm(me.getForm(), win, record.get('id'), 'server/modulos/usuarios/list.php');
    	Ext.getCmp('action_usuarios').setValue('EDITAR');
	    Ext.getCmp('senha_usuarios').setDisabled(true);
    },

    del: function(grid, record, button) {
     	var me = this;
     	me.deleteAjax(grid, 'usuarios', {
			action: 'DELETAR',
			id: record.get('id')
		}, button, false);

    },

    btedit: function(button) {
        if (this.getList().selModel.hasSelection()) {
			var record = this.getList().getSelectionModel().getLastSelected();
			this.edit(this.getList(), record);
		}
		else{
			info(this.titleErro, this.editErroGrid);
			return true;
		}
    },

    btdel: function(button) {
    	var me = this;
        if (me.getList().selModel.hasSelection()) {
			var record = me.getList().getSelectionModel().getLastSelected();

			Ext.Msg.confirm('Confirmar', 'Deseja deletar: '+record.get('nome')+'?', function(btn){
				if(btn=='yes'){
					me.del(me.getList(), record, button);
				}
			});
		}
		else{
			info(this.titleErro, this.delErroGrid);
			return true;
		}
    },

    add: function(button) {
    	var me = this;
		var win = Ext.getCmp('AddUsuariosWin');
        if(!win) win = Ext.widget('addusuarioswin');
        win.show();
    },

    update: function(button) {
    	var me = this;
		me.saveForm(me.getList(), me.getForm(), me.getAddWin(), button, false, false);
    },
	
    updateSenha: function(button) {
    	var me = this;
		var form = Ext.getCmp('FormSenha');
		var win = Ext.getCmp('AddSenhaWin');
		me.saveForm(false, form, win, button, false, false);
    },

    btStoreLoadFielter: function(button){
    	var win = Ext.getCmp('FilterUsuariosWin');
    	if(!win) win = Ext.widget('filterusuarioswin');
    	win.show();
    }

});
