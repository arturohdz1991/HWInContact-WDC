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
            {id: "teamId",dataType: tableau.dataTypeEnum.int},
            {id: "totalHandled",dataType: tableau.dataTypeEnum.int}
        ];
        var tableSchema = {
            id: "agentPerformance",
            alias: "Agent Performance",
            columns: cols
        };
        schemaCallback([tableSchema]);
    };
    //Function to request Access token
    function getToken(accessVariable,callback,table,doneCallback){
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
                callback(accessVariable.cluster,result,table,doneCallback);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                --ajaxCallsRemaining
			}
        });
    }
    //Function to request data
    function dataRequest(cluster,accessToken,table,donecallback){
		today = new Date()
		endDate = new Date(today.getFullYear(),today.getMonth(),today.getDate())
		last30 = new Date(today.setDate(endDate.getDate()-28))
		startDate = new Date(last30.getFullYear(),last30.getMonth(),last30.getDate())
		requestBody = {
			'startDate': startDate.toISOString(),
			'endDate': endDate.toISOString(),
			'fields': 'agentId,totalHandled'
		}
        $.ajax({
            'url':accessToken.resource_server_base_uri + "services/v16.0/agents/performance",
            'type':'GET',
            'headers':{
                'Authorization':'bearer '+ accessToken.access_token,
                'Content-Type':'application/x-www-form-urlencoded'
            },
			'data':requestBody,
			'timeout': 5*60*1000, //5 min timeout
            'success': function (result,status,statusCode){
                performList = result.agentPerformance
                for (record in performList){
                    if(performList[record].totalHandled>0){
						tableData.push({
							"Cluster":cluster,
							"agentId":performList[record].agentId,
							"totalHandled":performList[record].totalHandled
						})
					}
                }
				console.log(cluster+" Query Success")
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					table.appendRows(tableData)
					donecallback();
				}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(cluster+" Query Error")
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					donecallback();
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
            tableau.connectionName = "User Performance"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
