(function() {
    //Declare Global Variables
    var tableData = []
	var ajaxCallsRemaining = 0
	var accessData = new Object()
	// Create the connector object
	var myConnector = tableau.makeConnector();
	//Get Access Data
	function getAccessData(table,doneCallback){
		$.ajax({
            'url':'./accessData.json',
            'type':'GET',
			"dataType":"json",
			'success': function(result,status,statusCode){
            	ajaxCallsRemaining = Object.keys(result).length
				console.log(ajaxCallsRemaining+" Requests")
				accessData=result
				for (acObj in accessData){
					getToken(accessData[acObj],dataRequest,table,doneCallback);
				}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(accessVariable.cluster + " Token:" + textStatus);
				return null;
            }
        });
	}
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
			{id: "reportToId",alias:"Supervisor ID",dataType: tableau.dataTypeEnum.int},
			{id: "location",alias:"NIC Site",dataType: tableau.dataTypeEnum.string},
            {id: "internalId",alias:"NIC EID",dataType: tableau.dataTypeEnum.string},
            {id: "profileId",dataType: tableau.dataTypeEnum.int},
			{id: "profileName",dataType: tableau.dataTypeEnum.string},
			{id: "countryName",alias:"Country",dataType: tableau.dataTypeEnum.string},
			{id: "location",alias:"NIC Site",dataType: tableau.dataTypeEnum.string},
			{id: "state",alias:"State/Province",dataType: tableau.dataTypeEnum.string},
            {id: "city",alias:"City",dataType: tableau.dataTypeEnum.datetime},
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
            'timeout': 1*60*1000, //1 min timeout
            'success': function(result,status,statusCode){
                callback(accessVariable.cluster,result,table,doneCallBack);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
				--ajaxCallsRemaining
            }
        });
    }
    //Function to request data
    function dataRequest(cluster, accessToken,table,doneCallBack){
        requestBody = {
            'updatedSince': '',
            'isActive': '',
            'searchString': '',
            'fields': 'agentId,firstName,lastName,emailAddress,isActive,teamId,teamName,reportToId,location,city,countryName,state,profileId,profileName,createDate,inactiveDate,internalId,isBillable',
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
			'timeout': 5*60*1000, //5 min timeout
            'success': function (result,status,statusCode){
                agentList = result.agents
                for (record in agentList){
                    tableData.push({
						"Cluster":cluster,
						"agentId":agentList[record].agentId,
						"firstName":agentList[record].firstName,
						"lastName":agentList[record].lastName,
						"emailAddress":agentList[record].emailAddress,
						"isActive":agentList[record].isActive,
						"teamId":agentList[record].teamId,
						"teamName":agentList[record].teamName,
						"reportToId":agentList[record].reportToId,
						"location":agentList[record].location,
						"internalId":agentList[record].internalId,
						"profileId":agentList[record].profileId,
						"profileName":agentList[record].profileName,
						"createDate":agentList[record].createDate,
						"inactiveDate":agentList[record].inactiveDate,
						"isBillable":agentList[record].isBillable
					})
                }
                console.log(cluster+" Query Success")
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call(s) Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					table.appendRows(tableData)
					doneCallBack();
				}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(cluster+" Query Failure")
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call(s) Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					doneCallBack();
				}
            }
        });
    }

    // Download the data
    myConnector.getData = function(table, doneCallback) {
		getAccessData(table,doneCallback)
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
