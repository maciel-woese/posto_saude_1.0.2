/**
*	@Autor: Maciel Sousa
*	@Email: macielcr7@gmail.com
**/

Ext.define('ShSolutions.util.Controller', {
    extend: 'Ext.app.Controller',
	mixins: {
        controls: 'ShSolutions.controller.Util'
    },
	
	tabela		 	: false,
	modulo		 	: false,
	
	addmodulo	 	: false,
	listmodulo	 	: false,
	filtermodulo 	: false,
	
	button_add		: true,
	button_edit		: true,
	button_del		: true,
	button_filter	: true,
	button_pdf		: true,
	
	deleteRecord 	: false,
	
	constructor: function (config) {
        var me = this;
		/* refs */
		var refs = [];
		if(me.addmodulo){
			refs = Ext.Array.merge(refs, [
				{
					ref: 'addWin',
					selector: me.addmodulo
				},
				{
					ref: 'form',
					selector: me.addmodulo +' form'
				}
				
			]);
		}
		
		if(me.listmodulo){
			refs = Ext.Array.merge(refs, [
				{
					ref: 'list',
					selector: me.listmodulo
				},
				{
					ref: 'filterBtn',
					selector: me.listmodulo + ' button[action=filtrar]'
				}
				
			]);
		}
		
		if(me.filtermodulo){
			refs = Ext.Array.merge(refs, [
				{
					ref: 'filterWin',
					selector: me.filtermodulo
				},
				{
					ref: 'filterForm',
					selector: me.filtermodulo +' form'
				}
				
			]);
		}
		
		me.refs = me.refs ? Ext.Array.merge(me.refs, refs) : refs;
		
		/* control */
		var control = {};
		if(me.listmodulo){
			control[me.listmodulo] = {
				afterrender: this.getPermissoes,				
				render: this.gridLoad
			};
			
			if(me.button_filter){
				control[me.listmodulo + ' button[action=filtrar]'] = {
					click: this.btfilter
				};
			}
			
			if(me.button_add){
				control[me.listmodulo + ' button[action=adicionar]'] = {
					click: this.add
				};
			}
			
			if(me.button_edit){
				control[me.listmodulo + ' button[action=editar]'] = {
					click: this.btedit
				};
			}
			
			if(me.button_del){
				control[me.listmodulo + ' button[action=deletar]'] = {
					click: this.btdel
				};
			}
			
			if(me.button_pdf){
				control[me.listmodulo + ' button[action=gerar_pdf]'] = {
					click: this.gerarPdf
				};
			}
			
		}	
		
		if(me.addmodulo){
			control[me.addmodulo +' button[action=salvar]'] = {
				click: this.update
			};
			
			control[me.addmodulo +' button[action=resetar]'] = {
				click: this.reset
			};
			
			control[me.addmodulo +' form fieldcontainer combobox'] = {
				change: this.enableButton,
				render: this.comboLoad
			};
			
			control[me.addmodulo +' form fieldcontainer button[action=reset_combo]'] = {
				click: this.resetCombo
			};
			
			control[me.addmodulo +' form fieldcontainer button[action=add_win]'] = {
				click: this.getAddWindow
			};
		}
		
		if(me.filtermodulo){
			control[me.filtermodulo +' form fieldcontainer combobox'] = {
				change: this.enableButton,
				render: this.comboLoad
			};
			
			control[me.filtermodulo +' button[action=resetar_filtro]'] = {
				click: this.resetFielter
			};
			
			control[me.filtermodulo +' button[action=filtrar_busca]'] = {
				click: this.setFielter
			};
			
			control[me.filtermodulo] = {
				show: this.filterSetFields
			};
		}
		me.controls = me.controls ? Ext.Array.merge(me.controls, control) : control; 
		
		me.callParent(arguments);
    },
	
	init: function(app){
		this.control(this.controls);
		this.callParent(arguments);
	}

});

