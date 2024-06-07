sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/f/library',
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/core/message/MessageManager",
], function (Controller, fioriLibrary, ODataModel, JSONModel, MessageToast, ResourceModel, MessageManager) {
    "use strict";

    return Controller.extend("studentproject.controller.Detail", {

        onInit: function () {
            var oOwnerComponent = this.getOwnerComponent();

            this.oRouter = oOwnerComponent.getRouter();
            this.oModel = oOwnerComponent.getModel();

            const oListRoute = this.oRouter.getRoute("list");
            const oDetailRoute = this.oRouter.getRoute("detail");

            this.oRouter.getRoute("list").attachPatternMatched(this._onStudentMatched, this);
            this.oRouter.getRoute("detail").attachPatternMatched(this._onStudentMatched, this);

            this.oUniTable = this.oView.byId("UniTable");

            this._selectedItem = null;

        },

        _onStudentMatched: function (oEvent) {
            var expand = 'StudentToUni';
            this._student = oEvent.getParameter("arguments").student;

            this.getView().bindElement({
                path: "/results/" + this._student,
                model: "students"
            });

        },

        onSave: function (oEvent) {

            var oBusyDialog = this.getOwnerComponent()._busyDialog;

            var oJsonModel = this.getView().getModel("students");
            var oDataModel = sap.ui.getCore().getModel("oDataModel");

            var data = oJsonModel.getData();

            var itemToAdd = data.results[0];

            var aStudentToUnis = [];

            itemToAdd.StudentToUni.results.forEach(function (studentToUni) {
                aStudentToUnis.push({
                    Id: studentToUni.Id,
                    UniId: studentToUni.UniId,
                    UniName: studentToUni.UniName
                });
            });

            var date = new Date(1998, 4, 8, 7, 0, 0);

            var oNewEntry = {
                Id: itemToAdd.Id,
                Name: itemToAdd.Name,
                Dob: date,
                StudentToUni: aStudentToUnis
            };


            // this.getView().byId("SaveButton").addDependent(this.getOwnerComponent()._oMessagePopover);

            oBusyDialog.open();


            oDataModel.create('/StudentSet', oNewEntry, {

                success: (oData, oResponse) => {

                    oBusyDialog.close();
                    this.onCloseDialog();

                    var oButton = this.getView().byId("SaveButton");
                    this.onEdit();
                    this.getOwnerComponent().showMessagePopover(oButton);

                },
                error: (oError) => {

                    oBusyDialog.close();
                    this.onCloseDialog();
                    this.hideFooter(oJsonModel);
                    var oButton = this.getView().byId("SaveButton");
                    this.getOwnerComponent().showMessagePopover(oButton);
                }
            });


        },

        onMessagePress: function () {
            var oButton = this.getView().byId("MessageButton");
            this.getOwnerComponent().showMessagePopover(oButton);
        },

        showDialog: function () {
            var oJsonModel = this.getView().getModel("students");
            var bEditable = oJsonModel.getProperty("/editable");

            if (bEditable == true) {
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(this.getView().createId("DetailSaveFragment"), "studentproject.fragment.Dialog", this);
                    this.oDialog.setBindingContext(this.getView().getBindingContext());
                    this.getView().addDependent(this.oDialog);
                }
                this.oDialog.open();
            }
        },

        onValueHelpRequest: async function (oEvent) {
            var oBusyDialog = this.getOwnerComponent()._busyDialog;


            // provide your logic here, like opening a dialog
            this._uni = oEvent.getParameter("id");
            this._uni = this._uni.split("-");

            // row index
            this._uni = this._uni[this._uni.length - 1];

            if (!this.searchHelpDialog) {
                this.searchHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "studentproject.fragment.VattuSH", this);
                this.searchHelpDialog.setBindingContext(this.getView().getBindingContext());
                this.getView().addDependent(this.searchHelpDialog);
            }

            var oModel = this.getOwnerComponent().getModel("MaVatTu");
            var oComponent = this.getOwnerComponent();
            if (!oModel) {
                oBusyDialog.open();
                try {
                    oModel = await oComponent.getMaVatTuSH();
                } catch (e) {
                    console.error(e);
                    // handle error if needed
                }
                oBusyDialog.close();
            };


            this.searchHelpDialog.setModel(oModel);

            this.searchHelpDialog.open();
        },

        onSearchHelpLiveChange: function (oEvent) {
            var sQuery = oEvent.getParameter("value");
            var sQuery = oEvent.getSource().getValue();
            if (sQuery && sQuery.length > 0) {
                // create filter for name
                var filter = new sap.ui.model.Filter("Zmaphieu", sap.ui.model.FilterOperator.Contains, sQuery);
            } else {
                // if no input is given, reset the filter
                var filter = [];
            }
            // get student table's list binding
            var oList = this.byId("searchResultsList");
            var oBinding = oList.getBinding("items");
            // apply the filter to the list binding
            oBinding.filter(filter);

            // Add your custom search filtering logic here
        },

        onSearchHelpCancel: function () {
            this.searchHelpDialog.close();
        },

        onSearchHelpConfirm: function (oEvent) {
            // Put the code to handle the confirm action here.
            var oSelectedItem = this.selectedItem;;
            if (oSelectedItem) {
                var sSelectedTitle = oSelectedItem.getTitle();

                var oModel = this.getView().getModel("students"); // get model
                var data = oModel.getData();

                var studentIndex = this._student; // replace with actual student index
                var universityIndex = this._uni;

                data.results[studentIndex].StudentToUni.results[universityIndex].UniName = sSelectedTitle;

                oModel.refresh(true);
            }
            this.searchHelpDialog.close();
        },

        onListItemPress: function (oEvent) {
            this.selectedItem = oEvent.getParameter("listItem");
            // Remember the selected item's data or save it in a model or variable to be used later
            // You can directly bind the oSelectedItem to your input field if required
        },

        onCloseDialog: function () {
            this.oDialog.close();
            // this.oDialog.destroy(); // Destroy the dialog
            // this.oDialog = null; // Set the reference to null
        },

        onEdit: function () {
            var oJsonModel = this.getView().getModel("students");
            var bEditable = oJsonModel.getProperty("/editable");
            oJsonModel.setProperty("/editable", !bEditable);
            var bFooterVisible = oJsonModel.getProperty("/FooterVisible");
            oJsonModel.setProperty("/FooterVisible", !bFooterVisible);
            this.getView().getModel("students").refresh(true);
        },

        showFooter: function (oJsonModel) {
            var bFooterVisible = oJsonModel.getProperty("/FooterVisible");
            oJsonModel.setProperty("/FooterVisible", true);
            this.getView().getModel("students").refresh(true);
        },

        hideFooter: function (oJsonModel) {
            var bFooterVisible = oJsonModel.getProperty("/FooterVisible");
            oJsonModel.setProperty("/FooterVisible", false);
            this.getView().getModel("students").refresh(true);
        }

    });
});