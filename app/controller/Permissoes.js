Ext.define('ShSolutions.controller.Permissoes', {
    extend: 'Ext.app.Controller',

    models: [
        'ModelPermissoes'
    ],
    stores: [
        'StorePermissoes'
    ],
    views: [
        'permissoes.Edit'
    ],
    
    refs: [
        {
        	ref: 'tree',
        	selector: 'addpermissoeswin treepanel'
        },
		{
        	ref: 'win',
        	selector: 'addpermissoeswin'
        }   		
    ],
    
    init: function(application) {
    	this.control({
            'addpermissoeswin button[action=save]': {
                click: this.save
            },
            'addpermissoeswin treepanel': {
            	checkchange: this.checkTree
            }
    	});
    },
    
    setParent: function(node){
    	var parent = node.parentNode;
		var all = true;
		var checkList = [];
		
		parent.eachChild(function(v){
			var d = v.getData();
			if(d.checked==false){
				all = false;
			}
			else{
				checkList.push(d);
			}
		});
		
		if(parent.data.checked==false){
    		if(all==true){
    			parent.set('checked',true);
    		}
		}
		else if(parent.data.checked==true){
    		if(all==false){
    			parent.set('checked',false);
    		}
		}
    },
    
    checkNodes: function(parent, check){
    	var me = this;
    	parent.eachChild(function(v){
    		v.set('checked', check);
    		if(v.isLeaf()==false){
    			me.checkNodes(v, check);
    		}
    	});
    },
    
    markList: function(node, check){
    	var parent = node.parentNode;
    	if(check==true){
    		parent.eachChild(function(v){
    			if(v.get('acao')=='listar' && v.get('checked')==false){
    				v.set('checked', true);
    			}
        	});
    	}
    	else{
    		if(node.get('acao')=='listar' && node.get('checked')==false){
    			parent.eachChild(function(v){
       				v.set('checked', false);
            	});
    		}
    	}
    },
    
    checkTree: function(node, check){
    	if(node.isLeaf()==true){
    		this.markList(node, check);
    		this.setParent(node);
    	}
    	else{
    		this.checkNodes(node, check);
    	}
    },
    
    prepareJsonPerfil: function(){
    	var json = [];
    	var data = this.getTree().getView().getChecked();
    	Ext.each(data, function(v){
    		if(v.isLeaf()==true){
        		json.push(Ext.encode(v.getData()));
    		}
    	});

    	return json;
    },
    
    prepareJsonUsuario: function(){
    	var json = [];
    	this.getTree().getRootNode().eachChild(function(tab){
    		
    		tab.eachChild(function(v){
    			var data = v.getData();
    			var action = 0;
    			if(data.is_perfil==true){
    				if((data.checked==true && data.init_checked==false)){
    					action = 4; //remover Acesso N...
    				}
    				else if((data.checked==false && data.init_checked==true)){
    					action = 3; //adicionar Acesso N...
    				}
    			}
    			else{
    				if((data.checked==true && data.init_checked==false)){
    					action = 1; //adicionar Acesso S...
    				}
    				else if((data.checked==false && data.init_checked==true)){
    					action = 2; //remover Acesso S...
    				}
    			}
    			
    			if(action>0){
	    			data.action = action;
	    			json.push(Ext.encode(data));
    			}
    		});

    	});
    	
    	if(json.length>0){
    		return json;
    	}
    	else{
    		return false;
    	}
    },

    save: function(button){
		var me = this;
    	var params = me.getTree().store.proxy.extraParams;
		var action = params.action;
		if(action=='USUARIO'){
    		var json = me.prepareJsonUsuario();
    	}
    	else if(action=='PERFIL'){
    		var json = me.prepareJsonPerfil();
    	}
		me.getTree().el.mask('Aguarde...');
		params.json = [json];
		Ext.Ajax.request({
			url: 'server/modulos/permissoes/save.php',
			params: params,
			success: function(o){
				var o = Ext.decode(o.responseText);
				me.getTree().el.unmask();
				if(o.success==true){
					me.getWin().close();
					info('Aviso', o.msg);
				}
				else{
					info('Aviso!', o.msg);
				}
			},
			failure: function(o){
				me.getTree().el.unmask();
				var o = Ext.decode(o.responseText);
				info('Aviso!', o.msg);
			}
		});
    }

});
