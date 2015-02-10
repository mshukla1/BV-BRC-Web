require({cache:{
'url:p3/widget/templates/Uploader.html':"<form dojoAttachPoint=\"containerNode\" class=\"PanelForm\"\n    dojoAttachEvent=\"onreset:_onReset,onsubmit:_onSubmit,onchange:validate\">\n\t<div style='width:450px'>\n\t\t<div class=\"fileUploadButton\">\n\t\t\t<span>Add File(s)</span>\n\t\t\t<input type=\"file\" data-dojo-attach-point=\"fileInput\" multiple=\"true\" data-dojo-attach-event=\"onchange:onFileSelectionChange\" />\n\t\t</div>\n\t\t<select data-dojo-type=\"dijit/form/Select\" name=\"type\" data-dojo-attach-point=\"uploadType\" style=\"vertical-align: top;width:300px\" required=\"true\" data-dojo-props=\"\">\n\t\t\t<option value=\"unspecified\">Unspecified</option>\n\t\t\t<option value=\"contigs\">Contigs (.fa, .fasta) </option>\n\t\t<!--\t<option value=\"fasta\">fasta (.fa,.fasta) </option>-->\n\t\t\t<option value=\"reads\">Reads (.fa, .fasta, .fq, .fastq) </option>\t\t\n\t\t\t<option value=\"phenomics_gene_list\">Phenomics Gene List (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"phenomics_gene_matrix\">Phenomics Gene Matrix (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"phenomics_experiment_metadata\">Phenomics Experiment Comparison Metadata (.csv,.txt,.xsl,.xlsx)</option>\n\t\t\t<option value=\"proteomics_gene_list\">Proteomics Gene List (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"proteomics_gene_matrix\">Proteomics Gene Matrix (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"proteomics_experiment_metadata\">Proteomics Experiment Comparison Metadata (.csv,.txt,.xsl,.xlsx)</option>\t\n\t\t\t<option value=\"transcriptomics_gene_list\">Transcriptomics Gene List (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"transcriptomics_gene_matrix\">Transcriptomics Gene Matrix (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t\t<option value=\"transcriptomics_experiment_metadata\">Transcriptomics Experiment Comparison Metadata (.csv,.txt,.xsl,.xlsx)</option>\t\t\t\n\t\t</select>\n\t</div>\n\t\t<div data-dojo-attach-point=\"fileTableContainer\"></div>\n\n\t\t<div class=\"workingMessage\" style=\"width:400px;\" data-dojo-attach-point=\"workingMessage\">\n\t\t</div>\n\n\t\t<div style=\"margin:4px;margin-top:8px;text-align:right;\">\n\t\t\t<div data-dojo-attach-point=\"cancelButton\" data-dojo-attach-event=\"onClick:onCancel\" data-dojo-type=\"dijit/form/Button\">Cancel</div>\n\t\t\t<div data-dojo-attach-point=\"saveButton\" type=\"submit\" disabled=\"true\" data-dojo-type=\"dijit/form/Button\">Upload Files</div>\n\t\t</div>\t\n</form>\n\n \t\n"}});
define("p3/widget/Uploader", [
	"dojo/_base/declare","dijit/_WidgetBase","dojo/on",
	"dojo/dom-class","dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/Uploader.html","dijit/form/Form","dojo/_base/Deferred",
	"dijit/ProgressBar","dojo/dom-construct","p3/UploadManager","dojo/query","dojo/dom-attr",
	"dojo/_base/lang"
], function(
	declare, WidgetBase, on,
	domClass,Templated,WidgetsInTemplate,
	Template,FormMixin,Deferred,
	ProgressBar,domConstruct,UploadManager,Query,domAttr,
	lang
){
	return declare([WidgetBase,FormMixin,Templated,WidgetsInTemplate], {
		"baseClass": "CreateWorkspace",
		templateString: Template,
		path: "",
		overwrite: false,
		startup: function(){
			if (this._started){return;}

			this.inherited(arguments);
			var state = this.get("state")
			if ((state == "Incomplete") || (state == "Error")) {
			        this.saveButton.set("disabled", true);
			}

			this.watch("state", function(prop, val, val2){
			        console.log("Uplosd Form State: ",prop, val, val2);
			        if (val2=="Incomplete" || val2=="Error") {
			                this.saveButton.set("disabled", true);
			        }else{
			                this.saveButton.set('disabled',false);
			        }
			});
		},
		validate: function(){
			console.log("this.validate()",this);
			var valid = this.inherited(arguments);
			var validFiles = []
			Query("TR.fileRow",this.uploadTable).map(function(tr){
					validFiles.push({filename: domAttr.get(tr,"data-filename"), type: domAttr.get(tr, "data-filetype")});
			})
			if (!validFiles || validFiles.length<1){
				valid = false;
			}

			if (valid){
				this.saveButton.set("disabled", false)
			}else{
				this.saveButton.set("disabled",true);
			}
			return valid;
		},

		uploadFile: function(file, uploadDirectory,type){
			if (!this._uploading){ this._uploading=[]}

			var _self=this;

			return Deferred.when(window.App.api.workspace("Workspace.create",[{objects:[[uploadDirectory+file.name,(type||"unspecified"),{},""]],createUploadNodes:true}]), function(getUrlRes){
				domClass.add(_self.domNode,"Working");

				console.log("getUrlRes",getUrlRes, getUrlRes[0]);
				var uploadUrl = getUrlRes[0][0][11];
				console.log("uploadUrl: ", uploadUrl);
				if (!_self.uploadTable){
					var table = domConstruct.create("table",{style: {width: "100%"}}, _self.fileTableContainer);
					_self.uploadTable = domConstruct.create('tbody',{}, table)
				}

				var row = domConstruct.create("tr",{},_self.uploadTable);
				var nameNode = domConstruct.create("td",{innerHTML: file.name},row);

//					window._uploader.postMessage({file: file, uploadDirectory: uploadDirectory, url: uploadUrl});
					UploadManager.upload({file: file, uploadDirectory:uploadDirectory, url: uploadUrl}, window.App.authorizationToken);
				

			});

		},
		onFileSelectionChange: function(evt){
			console.log("onFileSelectionChange",evt, this.fileInput);
		
			if (!this.uploadTable){
				var table = domConstruct.create("table",{style: {width: "100%"}}, this.fileTableContainer);
				this.uploadTable = domConstruct.create('tbody',{}, table)
				var htr = domConstruct.create("tr", {}, this.uploadTable);
				domConstruct.create("th",{style: {"text-align":"left"}, innerHTML: "File"}, htr);
				domConstruct.create("th",{style: {"text-align":"left"}, innerHTML:"Type"},htr);
				domConstruct.create("th",{style: {"text-align":"left"}, innerHTML:"Size"},htr);
				domConstruct.create("th",{style: {"text-align": "right"}},htr);
			}

			var files = evt.target.files;
			console.log("files: ", files);
			var _self=this;
			
			Object.keys(files).forEach(function(idx) {
				var file = files[idx];
				if (file && file.name && file.size) {
					console.log("file: ", file);
					var row = domConstruct.create("tr",{"class":"fileRow"},_self.uploadTable);
					console.log('setfiletype: ', _self.uploadType.get('value'))
					domAttr.set(row,"data-filename",file.name);
					domAttr.set(row,"data-filetype",_self.uploadType.get('value'));
					var nameNode = domConstruct.create("td",{innerHTML: file.name},row);
					var typeNode = domConstruct.create("td",{innerHTML: _self.uploadType.get("value")},row);
					var sizeNode = domConstruct.create("td",{innerHTML: file.size},row);
					var delNode = domConstruct.create("td", {innerHTML: '<i class="fa fa-times fa-1x" />'},row);
					var handle=on(delNode,"click", lang.hitch(this,function(evt){
						handle.remove();	
						domConstruct.destroy(row);
						this.validate()
					}));
				}
			},this);
		},

		onSubmit: function(evt){
			var _self =this;
			evt.preventDefault();
			evt.stopPropagation();

			if (!_self.path) {
				console.error("Missing Path for Upload: ", _self.path);
				return;
			}
			var validFiles=[]
			Query("TR.fileRow",this.uploadTable).map(function(tr){
					validFiles.push({filename: domAttr.get(tr,"data-filename"), type: domAttr.get(tr, "data-filetype")});
			})
			console.log("Valid Files: ", validFiles, this.fileInput.files);
			var files={};

			Object.keys(_self.fileInput.files).forEach(function(key){
				files[_self.fileInput.files[key].name] = _self.fileInput.files[key];
			})

			validFiles.forEach(function(valid){
				var key = valid.filename;
				var f = files[key];
				console.log("f file:", f)
				if (f.name){
					this.uploadFile(f,_self.path,valid.type);
					console.log("File: ",f.name);
				}
			},this)

			on.emit(this.domNode, "dialogAction", {action:"close",bubbles:true});
		},

		onCancel: function(evt){
			console.log("Cancel/Close Dialog", evt)
			on.emit(this.domNode, "dialogAction", {action:"close",bubbles:true});
		}
	});
});
