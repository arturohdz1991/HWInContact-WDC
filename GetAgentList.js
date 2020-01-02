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
    //Access data for DSES
	accessData[7] = {'cluster':"DSES",'email':"Arturo.Hernandez2@DSES.com",'password':"Nov12345!",'applicationID':"Admin@DSES.com:4599200"}
	//Variable to store how many Requests are left to do
	ajaxCallsRemaining = Object.keys(accessData).length
	console.log(ajaxCallsRemaining+" Requests")
    // Create the connector object
    var myConnector = tableau.makeConnector();
    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var cols = [
            {id: "Cluster",dataType: tableau.dataTypeEnum.string},
            {id: "agentId",alias:"User ID",dataType: tableau.dataTypeEnum.int},
            {id: "firstName",dataType: tableau.dataTypeEnum.string},
            {id: "lastName",dataType: tableau.dataTypeEnum.string},
            {id: "emailAddress",alias:"NIC Email",dataType: tableau.dataTypeEnum.string},
            {id: "isActive",dataType: tableau.dataTypeEnum.bool},
            {id: "teamId",dataType: tableau.dataTypeEnum.int},
			{id: "teamName",dataType: tableau.dataTypeEnum.string},
			{id: "location",alias:"NIC Site",dataType: tableau.dataTypeEnum.string},
            {id: "internalId",alias:"NIC EID",dataType: tableau.dataTypeEnum.string},
            {id: "profileId",dataType: tableau.dataTypeEnum.int},
            {id: "profileName",dataType: tableau.dataTypeEnum.string},
            {id: "createDate",alias:"User Create Date",dataType: tableau.dataTypeEnum.datetime},
            {id: "inactiveDate",alias:"User Inactive Date",dataType: tableau.dataTypeEnum.datetime},
            {id: "isBillable",dataType: tableau.dataTypeEnum.bool}
        ];

        var tableSchema = {
            id: "agentList",
            alias: "User Lists",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };
    //Function to request Access token
    function getToken(accessVariable,callback,table,doneCallBack){
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
                callback(accessVariable.cluster,result,table,doneCallBack);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                callback(null);
            }
        });
    }
    //Function to request data
    function dataRequest(cluster, accessToken,table,doneCallBack){
        requestBody = {
            'updatedSince': '',
            'isActive': '',
            'searchString': '',
            'fields': 'agentId,firstName,lastName,emailAddress,isActive,teamId,teamName,isBillable,location,profileId,profileName,createDate,inactiveDate,internalId',
            'skip': '',
            'top': '',
            'orderBy': ''
        }
        $.ajax({
            'url':accessToken.resource_server_base_uri + "services/v16.0/agents",
            'type':'GET',
            'headers':{
                'Authorization':'bearer '+ accessToken.access_token,
                'Content-Type':'application/x-www-form-urlencoded'
            },
            'data':requestBody,
            'success': function (result,status,statusCode){
                agentList = result.agents
                for (record in agentList){
                    rowData = []
                    rowData.push(cluster)
                    agentDetails = agentList[record]
                    for (dataPoint in agentDetails){
                        rowData.push(agentDetails[dataPoint])
                    }
                    tableData.push(rowData)
                }
                console.log(cluster+" Query Success")
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					table.appendRows(tableData)
					doneCallBack();
				}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(cluster+" Error")
            }
        });
    }

    // Download the data
    myConnector.getData = function(table, doneCallback) {
        for (acObj in accessData){
			getToken(accessData[acObj],dataRequest,table,doneCallback);
            }
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "User List"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
