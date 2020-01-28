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
                console.log(accessVariable.cluster + " Token:" + status);
                callback(accessVariable.cluster,result,table,doneCallBack);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
				--ajaxCallsRemaining
                console.log(accessVariable.cluster + " Token:" + textStatus);
            }
        });
    }
    //Function to request data
    function dataRequest(cluster, accessToken,table,doneCallBack){
        if (cluster == "HON"|cluster == "PMT"){
            reportId = 1073742382;
        } else if(cluster == "HBT"|cluster == "SPS"){
            reportId = 1074092264;
        } else if(cluster == "AERO"|cluster == "SPSEM"){
            reportId = 1073741832;
        } else if(cluster == "HRCC"|cluster == "DSES"){
            reportId = 1073741825;
        }
        
		today = new Date()
		endDate = new Date(today.getFullYear(),today.getMonth(),today.getDate())
        startDate = new Date(today.getFullYear(),today.getMonth(),today.getDate())
        includeHeaders = false
        requestBody = {
            
        }
        $.ajax({
            'url':
            accessToken.resource_server_base_uri + "services/v16.0/report-jobs/datadownload/" + reportId +
            '?startDate=' + startDate.toISOString() + '&endDate=' + endDate.toISOString() + '&includeHeaders=' + includeHeaders,
            'type':'POST',
            'headers':{
                'Authorization':'bearer '+ accessToken.access_token,
                'Content-Type':'application/x-www-form-urlencoded'
            },
            'data':requestBody,
            'timeout': 5*60*1000, //5 min timeout
            'success': function (result,status,statusCode){
                //console.log(cluster + " Result:" + status);
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
				console.log(cluster + " Result:" + textStatus);
				--ajaxCallsRemaining
				console.log(ajaxCallsRemaining+" Call Remain")
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
            tableau.connectionName = "Admin Report"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
