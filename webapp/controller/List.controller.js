sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    'sap/m/MessageBox',
    "sap/ui/model/odata/v2/ODataModel",
    'sap/f/library',
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, ODataModel, fioriLibrary) {
    "use strict";

    return Controller.extend("studentproject.controller.List", {
        onInit: function () {

            this.oView = this.getView();
            this._bDescendingSort = false;
            this.oRouter = this.getOwnerComponent().getRouter();
        },

        showDialog: function () {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(this.getView().createId("ListSaveFragment"),"studentproject.fragment.Dialog", this);
                this.oDialog.setBindingContext(this.getView().getBindingContext());
                this.getView().addDependent(this.oDialog);
            }
            this.oDialog.open();

        },

        onCloseDialog: function () {
            this.oDialog.close();
        },

        onSave: function () {
            this.onCloseDialog();
            var oButton = this.getView().byId("OverflowToolbarButtonsSave");
            this.getOwnerComponent().showMessagePopover(oButton);
        },

        onSearch: function (oEvent) {
            // get value of search Field
            var sQuery = oEvent.getSource().getValue();
            if (sQuery && sQuery.length > 0) {
                // create filter for name
                var filter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery);
            } else {
                // if no input is given, reset the filter
                var filter = [];
            }
            // get student table's list binding
            var oList = this.byId("studentsTable");
            var oBinding = oList.getBinding("items");
            // apply the filter to the list binding
            oBinding.filter(filter);
        },

        onListItemPress: function (oEvent) {
            var studentPath = oEvent.getSource().getBindingContext("students").getPath(),
                student = studentPath.split("/").slice(-1).pop();

            this.oRouter.navTo("detail", { layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded, student: student });

        }
    });
});