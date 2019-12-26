(function() {
    //Declare Global Variables
    var tableData = []
    var accessData = new Object()
    //Access data for HWC
    accessData[0] = {'cluster':"HON",'email':"API_READONLY@HON.com",'password':"aP1_2020",'applicationID':"Alteryx@HON.com:4597891"}
    //Access data for PMT
    accessData[1] = {'cluster':"PMT",'email':"Kowsalya.Natarajan@pmt.com",'password':"Nttd@t@127",'applicationID':"Alteryx@PMT.com:4597432"}
    //Access data for HBT
    accessData[2] = {'cluster':"HBT",'email':"API_READONLY@HBT.com",'password':"aP1_2020",'applicationID':"Alteryx@HBT.com:4597435"}
    //Access data for SPS
    accessData[3] = {'cluster':"SPS",'email':"API_READONLY@SPS.com",'password':"aP1_2020",'applicationID':"Alteryx@SPS.com:4597431"}
    //Access data for AERO
    accessData[4] = {'cluster':"AERO",'email':"API_READONLY@AERO.com",'password':"aP1_2020",'applicationID':"Alteryx@AERO.com:4597433"}
    //Access data for SPSEM
    accessData[5] = {'cluster':"SPSEM",'email':"API_READONLY@SPSEM.com",'password':"aP1_2020",'applicationID':"Alteryx@EM.com:4597927"}
    //Access data for HRCC
    accessData[6] = {'cluster':"HRCC",'email':"API_READONLY@HRCC.com",'password':"aP1_2020",'applicationID':"Admin@HRCC.com:4599199"}

    // Create the connector object
    var myConnector = tableau.makeConnector();
    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var cols = [
            {id: "Agent_No",dataType: tableau.dataTypeEnum.int},
            {id: "Agent_Name",dataType: tableau.dataTypeEnum.string},
            {id: "Email",dataType: tableau.dataTypeEnum.string},
            {id: "Location",dataType: tableau.dataTypeEnum.string},
            {id: "Team",dataType: tableau.dataTypeEnum.string},
            {id: "Login_DateTime",dataType: tableau.dataTypeEnum.datetime},
            {id: "Station_Id",dataType: tableau.dataTypeEnum.int},
            {id: "Station_Phone_Num",dataType: tableau.dataTypeEnum.string},
            {id: "Station_Caller_ID",dataType: tableau.dataTypeEnum.int},
            {id: "ClientType",dataType: tableau.dataTypeEnum.string},
            {id: "Agent_Session_ID",dataType: tableau.dataTypeEnum.int},
            {id: "LoginStation_DateTime",dataType: tableau.dataTypeEnum.datetime}
        ];

        var tableSchema = {
            id: "adminList",
            alias: "Admin Lists",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };
    //Function to request Access token
    function getToken(accessVariable,callback){
        requestBody = {
            "grant_type" : "password",
            "username" : accessVariable.email,
            "password" : accessVariable.password,
            "scope" : ""
        }
        $.ajax({
            'url':'https://api.incontact.com/InContactAuthorizationServer/Token',
            'type':'POST',
            'headers':{
                'Authorization':'basic ' + btoa(accessVariable.applicationID),
                'Content-Type':'application/x-www-form-urlencoded'
            },
            'data':requestBody,
            'success': function(result,status,statusCode){
                //document.getElementById("result").innerHTML += "<br>1:" + JSON.stringify(result);
                //accessToken = result
                console.log(accessVariable.cluster + " Token:" + status);
                callback(accessVariable.cluster,result);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                //document.getElementById("result").innerHTML += "<br>1:" + JSON.stringify(errorThrown);
                console.log(accessVariable.cluster + " Token:" + textStatus);
            }
        });
    }
    //Function to request data
    function dataRequest(cluster, accessToken){
        if (cluster == "HON"|cluster == "PMT"){
            reportId = 1073742382;
        } else if(cluster == "HBT"|cluster == "SPS"){
            reportId = 1074092264;
        } else if(cluster == "AERO"|cluster == "SPSEM"){
            reportId = 1073741832;
        } else if(cluster == "HRCC"|cluster == "DSES"){
            reportId = 1073741825;
        }
        
        startDate = new Date().toISOString()
        endDate = new Date().toISOString()
        includeHeaders = false
        requestBody = {
            
        }
        $.ajax({
            'url':
            accessToken.resource_server_base_uri + "services/v16.0/report-jobs/datadownload/" + reportId +
            '?startDate=' + startDate + '&endDate=' + endDate + '&includeHeaders=' + includeHeaders,
            'type':'POST',
            'headers':{
                'Authorization':'bearer '+ accessToken.access_token,
                'Content-Type':'application/x-www-form-urlencoded'
            },
            'data':requestBody,
            'success': function (result,status,statusCode){
                //document.getElementById("result").innerHTML = Array.isArray(result.agents)
                console.log(cluster + " Result:" + status);
                csvResult = atob(result.file)
                //csvResult.replace(/(\r\n|\n|\r)/gm,";")
                csvRows=csvResult.split(/\n/)
                //for (csvRow=0;csvRow<1;csvRow++){
                for (csvRow=0;csvRow<csvRows.length;csvRow++){
                    //console.log(csvRows[csvRow])
                    rowData = []
                    agentDetails = csvRows[csvRow].split(',')
                    for (dataPoint=0;dataPoint<agentDetails.length;dataPoint++){
                        //console.log(agentDetails[dataPoint])
                        rowData.push(agentDetails[dataPoint])
                    }
                    tableData.push(rowData)
                }
                //document.getElementById("result").innerHTML += "<br>2:" + tableData
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(cluster + " Result:" + textStatus);
            }
        });
    }

    // Download the data
    myConnector.getData = function(table, doneCallback) {
        for (acObj in accessData){
                getToken(accessData[acObj],dataRequest);
            }
        //alert(tableData)
        setTimeout(function(){
            table.appendRows(tableData)
            doneCallback();
        }, 60000);
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "Admin Report"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
