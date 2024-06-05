/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "studentproject/model/models",
    "sap/ui/model/odata/v2/ODataModel",
    'sap/ui/model/json/JSONModel',
    'sap/f/library',
    "sap/ui/model/resource/ResourceModel",
    "sap/m/BusyDialog",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem"
],

    function (UIComponent, Device, models, ODataModel, JSONModel, fioriLibrary, ResourceModel, BusyDialog, MessagePopover, MessagePopoverItem) {

        "use strict";

        return UIComponent.extend("studentproject.Component", {
            metadata: {
                manifest: "json",
                aggregations: {
                    // define the new aggregation for MessagePopover
                    messagePopover: { type: 'sap.m.MessagePopover', multiple: false }
                }
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function


                var oModel,
                    oRouter;

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().attachBypassed(function () {
                    this.destroy(); // replace 'this' with reference to your component
                }, this);


                oModel = new JSONModel();
                this.setModel(oModel);

                // enable routing
                oRouter = this.getRouter();
                oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
                oRouter.initialize();

                //message

                this.oMessageManager = sap.ui.getCore().getMessageManager();
                var oMessageModel = this.oMessageManager.getMessageModel();


                // Create a Message Popover and add it as a dependent to the UIComponent
                this.oMessagePopover = new MessagePopover({
                    items: {
                        path: "message>/",
                        sorter: new sap.ui.model.Sorter('type'),
                        template: new MessagePopoverItem({
                            // description: "{message>message}",
                            type: "{message>type}",
                            title: "{message>message}"
                        })
                    }
                });

                // Attach event listener on the `afterClose` event
                this.oMessagePopover.attachAfterClose(function () {
                    // Get the Message Model
                    var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();

                    // Get all messages
                    var aMessages = oMessageModel.getData();

                    // Remove each message from the Message Manager
                    aMessages.forEach(function (oMessage) {
                        sap.ui.getCore().getMessageManager().removeMessages(oMessage);
                    });
                });

                this.setModel(oMessageModel, "message");
                // this.getRootControl().addDependent(this.oMessagePopover);
                // this.setAggregation("messagePopover", this._oMessagePopover);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                this._busyDialog = new BusyDialog();

                var i18nModel = new ResourceModel({
                    bundleName: "studentproject.i18n.i18n" // adjust to your app structure
                });

                // Create a new instance of the ODataModel
                var oStudentModel = new ODataModel("/sap/opu/odata/sap/ZSTUDENT_SRV/", {
                    json: true,
                    loadMetadataAsync: true,
                    tokenHandling: true
                });

                // Set the model to the core of the application

                sap.ui.getCore().setModel(i18nModel, "i18n");
                sap.ui.getCore().setModel(oStudentModel, "oDataModel");

                this._busyDialog.open();
                oStudentModel.read("/StudentSet", {
                    urlParameters: {
                        "$expand": "StudentToUni",
                        "$format": "json"
                    },
                    success: (oData, oResponse) => {
                        var headers = oResponse.headers;
                        var jsonModel = new JSONModel(oData);
                        jsonModel.setProperty("/editable", false);
                        jsonModel.setProperty("/FooterVisible", false);
                        this.setModel(jsonModel, "students"); // setting the model data
                        this._busyDialog.close();
                    },
                    error: (oError) => {
                        this._busyDialog.close();
                        console.log("Error", oError);
                    }
                });

            },

            getMaVatTuSH: function () {
                return new Promise((resolve, reject) => {
                    //get SearchHelp
                    var oVattuModel = new ODataModel("/sap/opu/odata/sap/ZSH_MAVATTU_SRV/", {
                        json: true,
                        loadMetadataAsync: true,
                        tokenHandling: true
                    });
                    sap.ui.getCore().setModel(oVattuModel, "oVattuModel");

                    oVattuModel.read("/ZshVattuSet", {
                        urlParameters: {
                            "$format": "json"
                        },
                        success: (oData, oResponse) => {

                            var jsonModel = new JSONModel(oData);
                            this.setModel(jsonModel, "MaVatTu"); // setting the model data

                            resolve(jsonModel);

                        },
                        error: (oError) => {
                            console.log("Error", oError);
                            reject(oError);
                        }
                    });
                });
            },

            showMessagePopover: function (oSaveButton) {
                var messages = this.oMessageManager.getMessageModel().getData();
                var oMessagePopover = this.oMessagePopover;

                // Add the message popover as a dependent to the save button
                oSaveButton.addDependent(oMessagePopover);

                // Open the message popover by the save button
                oMessagePopover.openBy(oSaveButton);

            },

            setBusy: function (bBusy) {
                if (bBusy) {
                    this._oBusyDialog.open();
                } else {
                    this._oBusyDialog.close();
                }
            },

            _onBeforeRouteMatched: function (oEvent) {
                var oModel = this.getModel(),
                    sLayout = oEvent.getParameters().arguments.layout;

                // If there is no layout parameter, set a default layout (normally OneColumn)
                if (!sLayout) {
                    sLayout = fioriLibrary.LayoutType.OneColumn;
                }

                oModel.setProperty("/layout", sLayout);
            },
        });
    }
);