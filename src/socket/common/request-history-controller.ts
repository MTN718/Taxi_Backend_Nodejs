import SocketController from "../interfaces/socket.controller.interface";
import { UserType } from "../../models/enums/enums";
import { Request } from "../../entities/request";
import { Complaint } from "../../entities/complaint";
import { DriverTransaction } from "../../entities/driver-transaction";
import { RiderTransaction } from "../../entities/rider-transaction";
import { ClientType } from "../../models/client-jwt-decoded";
import { Driver } from "../../entities/driver";
import { Rider } from "../../entities/rider";
import { request } from "express";

export default class RequestHistoryController extends SocketController {
    constructor(socket: any, userType: UserType) {
        super(socket, userType)
        socket.on('GetRequestHistory', this.getAll.bind(this))
        socket.on('WriteComplaint', this.writeComplaint.bind(this))
        socket.on('HideHistoryItem', this.hideRequest.bind(this))
        socket.on('GetTransactions', this.getTransactions.bind(this))
        socket.on('InvoiceRequest', this.invoiceRequest.bind(this))
        socket.on('InvoiceRequestRider', this.invoiceRequestRider.bind(this))
    }

    async invoiceRequestRider(params,callback){
        console.log(params);
        let transaction = await RiderTransaction.findOne(params.reqId);
        console.log(transaction);
        var path = `${__dirname}/../../../invoice/Inv${transaction.requestId}.xlsx`;
        console.log(path);
        const nodemailer = require("nodemailer");
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
                user: 'accounts@thera-app.com', // generated ethereal user
                pass: 'QW#zQ}JJH=d5].cx', // generated ethereal password
            },
        });
        let riderInfo = await Rider.findOne({where:{id:transaction.riderId}})
        var riderDetail = "Full Name: " + riderInfo.email + " Email: " + riderInfo.address;
        console.log(riderDetail);
        var receiverAddress = riderInfo.address;        
        const fs = require('fs')
        try {
            if (fs.existsSync(path)) {
                //file exists
                const fs = require('fs');
                fs.readFile(path, function (err, data) {
                    let info = transporter.sendMail({
                        from: '"Thera-App Support"', // sender address
                        to: receiverAddress,
                        bcc: "accounts@thera-app.com",
                        subject: 'Invoice File',
                        body: 'This is invoice to check',
                        attachments: [{'filename': 'invoice.xlsx', 'content': data}]
                    });
                    
                });
            }
            else
            {
                console.log('Not exist invoice file');
                receiverAddress = "ICD@thera-app.com";
                let info = transporter.sendMail({
                    from: '"Thera-App Support"', // sender address
                    to: receiverAddress,
                    bcc: "accounts@thera-app.com",
                    subject: 'Invoice File',
                    body: riderDetail,
                    text: riderDetail
                });

            }
        } catch(err) {
            console.error(err)
            receiverAddress = "ICD@thera-app.com";
            let info = transporter.sendMail({
                from: '"Thera-App Support"', // sender address
                to: receiverAddress,
                bcc: "accounts@thera-app.com",
                subject: 'Invoice File',
                body: riderDetail,
            });
        }




    }
    async invoiceRequest(params,callback){
        console.log(params);
        var reqId = params.requestId;
        var invName = params.name;
        var invCode = params.code;

        let request = await Request.findOne(reqId);
        Request.find({where: {driver: {id: this.socket.user.id},id:reqId }, take : 50, order: {id: 'DESC'}})

        var xl = require('excel4node');
        var wb = new xl.Workbook();
 
        // Add Worksheets to the workbook
        var ws = wb.addWorksheet('CE',{sheetView:{showGridLines:false}});

        var date = new Date(request.requestTimestamp);
        var dateString = (date.getMonth()+1)  + '/' + date.getDate() + '/' + date.getFullYear();


        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        ws.column(1).setWidth(2.0);
        ws.column(2).setWidth(22.75);
        ws.column(3).setWidth(2.5);
        ws.column(4).setWidth(11.13);
        ws.column(5).setWidth(27.5);
        ws.column(6).setWidth(13.63);
        ws.column(7).setWidth(11.63);
        ws.column(8).setWidth(1.75);

        ws.row(1).setHeight(57.75);
        ws.row(2).setHeight(13.5);
        ws.row(3).setHeight(12.75);
        ws.row(4).setHeight(12.75);
        ws.row(5).setHeight(12.75);
        ws.row(6).setHeight(12.75);
        ws.row(7).setHeight(12.75);
        ws.row(8).setHeight(12.75);
        ws.row(9).setHeight(12.75);
        ws.row(10).setHeight(12.75);
        ws.row(11).setHeight(200);        

        ws.cell(1, 6).string("TAX INVOICE").style({alignment: { horizontal: 'center',vertical:'center'},font: {size: 14,bold: true}});
        ws.cell(2, 6).string("Date").style({font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(2, 7).string(dateString).style({font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(3, 6).string("IN Nr.").style({font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(3, 7).string("T" + Date.now()).style({font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        
        console.log(request);
	console.log('here here here');
        let drvInfo = await Driver.findOne({where:{id:request.driverId}})
        let riderInfo = await Rider.findOne({where:{id:request.riderId}})
        console.log(drvInfo);
        ws.cell(5, 2, 5, 3, true).string('Physiotherapist Details').style({alignment: { horizontal: 'center',vertical:'center'},font: {size: 9,bold:true},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(6, 2, 6, 3, true).string('Name: ' + drvInfo.firstName + drvInfo.lastName).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(7, 2, 7, 3, true).string('HPCSA Number: ' + drvInfo.carPlate).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(8, 2, 8, 3, true).string('Practice Number: ' + drvInfo.address).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});

        ws.cell(5, 3).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(6, 3).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(7, 3).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(8, 3).style({border:{outline: true,right: {style: 'thin'}}});

        
        ws.cell(5, 6, 5, 7, true).string('Patient Details').style({alignment: { horizontal: 'center',vertical:'center'},font: {size: 9,bold:true},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(6, 6, 6, 7, true).string('Name: ' + riderInfo.email).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(7, 6, 7, 7, true).string('Medical Aid: ' + riderInfo.firstName).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});
        ws.cell(8, 6, 8, 7, true).string('Medical Aid Number: ' + riderInfo.lastName).style({alignment: { horizontal: 'left',vertical:'center'},font: {size: 9},border:{outline: true,left: {style: 'thin',},right: {style: 'thin', },top: {style: 'thin', },bottom: {style: 'thin'}}});

        ws.cell(5, 7).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(6, 7).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(7, 7).style({border:{outline: true,right: {style: 'thin'}}});
        ws.cell(8, 7).style({border:{outline: true,right: {style: 'thin'}}});

        var receiverAddress = riderInfo.address;
        if (invCode == "Other")
        {
            receiverAddress = "ICD@thera-app.com";
        }
        else
        {
            ws.addImage({
                path: `${__dirname}/../../../invoice/${invCode}.jpg`,
                type: 'picture',
                position: {
                type: 'oneCellAnchor',
                from: {
                    col: 1,                
                    row: 11
                },
                },
            });
        }



        wb.write(`${__dirname}/../../../invoice/Inv${reqId}.xlsx`,function(err,stats){
            if (err){

            }
            else
            {
                const nodemailer = require("nodemailer");

        

                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,     
                    auth: {
                      user: 'accounts@thera-app.com', // generated ethereal user
                      pass: 'QW#zQ}JJH=d5].cx', // generated ethereal password
                    },
                });


                const fs = require('fs');
                fs.readFile(`${__dirname}/../../../invoice/Inv${reqId}.xlsx`, function (err, data) {

                    let info = transporter.sendMail({
                        from: '"Thera-App Support"', // sender address
                        to: receiverAddress,
                        bcc: "accounts@thera-app.com",
                        subject: 'Thera Invoice',
                        text: 'Good Day,\n\n Thank you for using Thera. \n\nWe hope you enjoyed your session, please find attached a copy of your invoice for medical aid submission.\n\n If you have any queries, reply to this email and someone will get back you by next business day.\n\nLook forward to seeing you again,\n\nThera Team',
                        attachments: [{'filename': 'invoice.xlsx', 'content': data}]
                    });
                    
                });


            }
        });        

        

        // let transporter = nodemailer.createTransport({
        //     host: "mail.thera-app.com",
        //     port: 587,     
        //     secure: false,        
        //     auth: {
        //         user: 'accounts@thera-app.com', // generated ethereal user
        //         pass: 'Z(.IPsUR1~sj', // generated ethereal password
        //     },
        // });
       

        




    }
    async getAll(callback) {
        if(this.socket.user.t == ClientType.Driver) {
            let requests = await Request.find({where: {driver: {id: this.socket.user.id} }, take : 50, order: {id: 'DESC'}})
            for (let i = 0;i < requests.length;i++)
            {
                let riderInfo = await Rider.findOne({where:{id:requests[i].riderId}})
                requests[i].rider = riderInfo;
            }
            callback(requests);
        } else {

            let requests = await Request.find({where: {rider: {id: this.socket.user.id}, isHidden: false }, take : 50, order: {id: 'DESC'}})
            for (let i = 0;i < requests.length;i++)
            {
                let driverInfo = await Driver.findOne({where:{id:requests[i].driverId}})
                requests[i].driver = driverInfo;
            }
            callback(requests);


            //callback(await Request.find({where: {rider: {id: this.socket.user.id}, isHidden: false }, take : 50, order: {id: 'DESC'}}));
        }
    }

    async writeComplaint(travelId: number, subject: string, content: string, callback) {
        let request = await Request.findOne(travelId);
        await Complaint.insert({
            request: request,
            requestedBy: this.socket.user.t,
            subject: subject,
            content: content
        })
        callback();
    }

    async hideRequest(travelId: number, callback) {
        await Request.update(travelId, {isHidden: true})
        callback();
    }

    async getTransactions(callback) {
        if(this.socket.user.t == ClientType.Driver) {
            callback(await DriverTransaction.find({where: {driver: {id: this.socket.user.id}}, take : 50, order: {id: 'DESC'}}))
        } else {

            let transactions = await RiderTransaction.find({where: {rider: {id: this.socket.user.id}}, take : 50, order: {id: 'DESC'}});
            let datas = [];
            let k = 0;
            for (let i = 0;i < transactions.length;i++)
            {
                if (transactions[i].transactionType != "Travel") continue;                
                console.log(transactions[i].requestId)
                let reqInfo = await Request.findOne({where:{id:transactions[i].requestId}})
                let driverId = reqInfo.driverId;
                let drvInfo = await Driver.findOne({where:{id:driverId}})
                transactions[i]['driver'] = drvInfo;
                datas[k] = transactions[i];
                k++;
            }
            callback(datas);
        }
    }
}