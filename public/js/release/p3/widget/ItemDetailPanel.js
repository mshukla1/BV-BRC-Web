require({cache:{
'url:p3/widget/templates/ItemDetailPanel.html':"<div class=\"ItemDetailPanel noSelection\">\n\t<div class=\"noItemSelection\">\n\t\tNothing selected.\n\n\t\t<div class=\"folder containerContentSection\">\n\t\t\t<div class='tip'>\n\t\t\t\tSelect one or more items on the left to see their details and possible actions.\n\t\t\t</div>\n\n\t\t\t<div class=\"tip\">\n\t\t\t\tClick an item's \"type\" icon or double click on a row to drill down into that item.\n\t\t\t</div>\n\t\t</div>\n\n\t</div>\n\n\t<div class=\"multipleItemSelection\">\n\t\t<div data-dojo-attach-point=\"countDisplayNode\">N items selected.</div>\n\t</div>\n\n\t<div class=\"singleItemSelection\">\n\t<div>\n\t\t<table class=\"ItemDetailHeaderTable\">\n\t\t\t<tbody>\n\t\t\t\t<tr>\n\t\t\t\t\t<td style=\"width:1%\"><i class=\"fa fa-1x\" data-dojo-attach-point=\"typeIcon\" ></i></td>\n\t\t\t\t\t<td>\n\t\t\t\t\t\t<div class=\"ItemDetailHeader\" data-dojo-type=\"dijit/InlineEditBox\" data-dojo-attach-point=\"nameWidget\" disabled=\"true\"></div>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>\n\t\t\t</tbody>\n\t\t</table>\n\t</div>\n\t<div style=\"font-size:1em\">\n\t\t<div class=\"ItemDetailAttribute\">Type: <div class=\"ItemDetailAttributeValue\" data-dojo-attach-event=\"onChange:saveType\" data-dojo-attach-point=\"typeNode\" data-dojo-type=\"dijit/InlineEditBox\" data-dojo-props=\"editor:'dijit.form.Select', autoSave:false, editorParams:{ \n                    options:[]}\" value=\"\" disabled=\"true\"></div></div>\n\t\t</br>\n\t\t<div class=\"ItemDetailAttribute\">Owner: <span class=\"ItemDetailAttributeValue\"  data-dojo-attach-point=\"owner_idNode\"></span></div></br>\n\t\t<div class=\"ItemDetailAttribute\">Created: <span class=\"ItemDetailAttributeValue\" data-dojo-attach-point=\"creation_timeNode\"></span></div></br>\n\t\t<div class=\"ItemDetailAttribute\">Path: <span class=\"ItemDetailAttributeValue\" data-dojo-attach-point=\"pathNode\"></span></div>\n\t\t<div style=\"display:none;\" data-dojo-attach-point=\"idNode\"></div>\n\t</div> \n\t<div data-dojo-attach-point=\"autoMeta\">\n\n\t</div>\n\t<table>\n\t\t<tbody data-dojo-attach-point=\"userMetadataTable\">\n\t\t</tbody>\n\t</table>\n\t</div>\n</div>\n"}});
define("p3/widget/ItemDetailPanel", [
	"dojo/_base/declare","dijit/_WidgetBase","dojo/on",
	"dojo/dom-class", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/ItemDetailPanel.html","dojo/_base/lang","./formatter","dojo/dom-style",
	"../WorkspaceManager"
], function(
	declare, WidgetBase, on,
	domClass,Templated,WidgetsInTemplate,
	Template,lang,formatter,domStyle,
	WorkspaceManager
){
	return declare([WidgetBase,Templated,WidgetsInTemplate], {
		"baseClass": "ItemDetailPanel",
		"disabled":false,
		"changeableTypes":{unspecified:{label:"unspecified",value:"unspecified"},contigs:{label:"contigs",value:"contigs"},reads:{label:"reads",value:"reads"},diffexp_input_data:{label:"diffexp_input_data",value:"diffexp_input_data"},diffexp_input_metadata:{label:"diffexp_input_metadata",value:"diffexp_input_metadata"}},
		templateString: Template,
		selection: null,
		item: null,
		containerWidget: null,

		property_aliases: {
			document_type: "type",
			"organism_name": "name"
		},
		startup: function(){
			var _self=this;
			//if (this._started) { return; }
			var currentIcon;

			this.watch("containerWidget", lang.hitch(this, function(prop,oldVal,containerWidget){
				console.log("set containerWidget", containerWidget);

				if (oldVal && oldVal.containerType){
					domClass.remove(this.domNode, oldVal.containerType);
				}

				this.containerWidget = containerWidget;
				if (this.containerWidget && this.containerWidget.containerType){
					domClass.add(this.domNode, this.containerWidget.containerType);
				}

			}));

			this.watch("selection", lang.hitch(this,function(prop,oldVal,selection){
				console.log("ItemDetailPanel set selection: ", selection);

				if (!selection || selection.length<1){
					console.log("no selection set");
					domClass.add(this.domNode, "noSelection");
					domClass.remove(this.domNode, "multipleSelection");
					domClass.remove(this.domNode, "singleSelection");
				}else if (selection && selection.length==1){
					console.log("single selection set");
					domClass.remove(this.domNode, "noSelection");
					domClass.remove(this.domNode, "multipleSelection");
					domClass.add(this.domNode, "singleSelection");
					this.set("item", selection[0]);
				}else if (selection && selection.length>1){
					console.log("multiple Selection set");
					domClass.remove(this.domNode, "noSelection");
					domClass.add(this.domNode, "multipleSelection");
					domClass.remove(this.domNode, "singleSelection");
					this.countDisplayNode.innerHTML = selection.length + " items selected.";
				}
			}));

			this.watch("item", lang.hitch(this,function(prop,oldVal,item){
				console.log("ItemDetailPanel Set(): ", arguments);
				domClass.remove(_self.typeIcon,currentIcon)
				var t = item.document_type || item.type;
				switch(t){
					case "folder": 
						domClass.add(_self.typeIcon,"fa fa-folder fa-2x")
						currentIcon="fa fa-folder fa-2x";
						break;
					//case "contigs": 
					//	domClass.add(_self.typeIcon,"fa icon-contigs fa-3x")
					//	currentIcon="fa fa-folder fa-3x";
					//	break;
					case "contigs": 
						domClass.add(_self.typeIcon,"fa icon-contigs fa-2x")
						currentIcon="fa fa-contigs fa-2x";
						break;
					case "fasta": 
						domClass.add(_self.typeIcon,"fa icon-fasta fa-2x")
						currentIcon="fa icon-fasta fa-2x";
						break;
					case "genome_group": 
						domClass.add(_self.typeIcon,"fa icon-genome_group fa-2x")
						currentIcon="fa icon-genome_group fa-2x";
						break;
					case "job_result":
						domClass.add(_self.typeIcon, "fa fa-flag-checkered fa-2x")
						currentIcon="fa icon-flag-checkered fa-2x";
						break;
					case "feature_group": 
						domClass.add(_self.typeIcon,"fa icon-genome-features fa-2x")
						currentIcon="fa icon-genome-features fa-2x";
						break;
	
					default: 
						domClass.add(_self.typeIcon,"fa fa-file fa-2x")
						currentIcon="fa fa-file fa-2x";
						break;
				}	
				Object.keys(item).forEach(function(key){
       	                		var val = item[key];
					if(key == "creation_time"){
						val=formatter.date(val);
					}
					if (key == "type"){
						_self[key + "Node"].set('value',val);
						_self[key + "Node"].set('displayedValue',val);
						_self[key + "Node"].cancel();
						if (this.changeableTypes.hasOwnProperty(val)){
							_self[key + "Node"].set('disabled',false);
							domStyle.set(_self[key + "Node"].domNode,"text-decoration","underline");
							var type_options=[];
							Object.keys(this.changeableTypes).forEach(function(change_type){
								type_options.push(this.changeableTypes[change_type]);
							}, this);
							_self[key + "Node"].editorParams.options=type_options;
						}
						else{
							_self[key + "Node"].set('disabled',true);
							domStyle.set(_self[key + "Node"].domNode,"text-decoration","none");
						}
					}	
					else if (this.property_aliases[key] && _self[this.property_aliases[key] + "Node"]){
						_self[this.property_aliases[key] + "Node"].innerHTML=val;	
					}else if (this.property_aliases[key] && _self[this.property_aliases[key] + "Widget"]){
						_self[this.property_aliases[key] + "Widget"].set("value",val);
					}else if (_self[key + "Node"]){
						_self[key+"Node"].innerHTML=val;
					}else if (_self[key +"Widget"]){
						_self[key+"Widget"].set("value",val);
					}else if (key == "autoMeta"){
						var curAuto = formatter.autoLabel("itemDetail", item.autoMeta);
						subRecord=[];
						Object.keys(curAuto).forEach(function(prop){
							if (!curAuto[prop] || prop=="inspection_started") { return; }
							if (curAuto[prop].hasOwnProperty("label") && curAuto[prop].hasOwnProperty("value")){
								subRecord.push('<div class="ItemDetailAttribute">'+curAuto[prop]["label"]+': <span class="ItemDetailAttributeValue">'+curAutoLabel[prop]["value"]+'</span></div></br>');
							}
							else if (curAuto[prop].hasOwnProperty("label")){
								subRecord.push('<div class="ItemDetailAttribute">'+curAuto[prop]["label"]+'</div></br>');
							}
						},this);
						_self["autoMeta"].innerHTML=subRecord.join("\n");
					//	Object.keys(val).forEach(function(aprop){
					//	},this);
					}
				},this);
			}))
			this.inherited(arguments);
		},

		saveType: function(val){
			console.log("onSaveType: ", val, this.item);
			WorkspaceManager.updateMetadata(this.item.path,false,val);		
		}
	});
});
