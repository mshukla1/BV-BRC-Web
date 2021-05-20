define([
  'dojo/_base/declare', 'dojo/text!./templates/VariantHelp.html',
  'dijit/_WidgetBase', 'dijit/_Templated'

], function (
  declare, Template,
  WidgetBase, Templated
) {
  return declare([WidgetBase, Templated], {
    baseClass: 'VariantHelp',
    disabled: false,
    templateString: Template,
    apiServiceUrl: window.App.dataAPI,

    startup: function () {
      if (this._started) {
        return;
      }
      this.inherited(arguments);
    }
  });
});
