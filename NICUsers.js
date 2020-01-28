(function() {
    //Declare Global Variables
    var tableData = []
	var ajaxCallsRemaining = 0
	var accessData = new Object()
	// Create the connector object
	var myConnector = tableau.makeConnector();
	
    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
		
		//Define User List Table
		var userListCols = [
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
            {id: "createDate",alias:"User Create Date",dataType: tableau.dataTypeEnum.datetime},
            {id: "inactiveDate",alias:"User Inactive Date",dataType: tableau.dataTypeEnum.datetime},
            {id: "isBillable",dataType: tableau.dataTypeEnum.bool}
        ];
        var userListSchema = {
            id: "agentList",
            alias: "User Lists",
            columns: userListCols
		};
		// Define Admin List Table
		var adminListCols = [
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
        var adminListSchema = {
            id: "adminList",
            alias: "Admin Lists",
            columns: adminListCols
        };
		
		//Define Agent Performance
		var AgentPerfCols = [
            {id: "Cluster",dataType: tableau.dataTypeEnum.string},
            {id: "agentId",alias:"User ID",dataType: tableau.dataTypeEnum.int},
            {id: "totalHandled",dataType: tableau.dataTypeEnum.int}
        ];
        var AgentPerfSchema = {
            id: "agentPerformance",
            alias: "Agent Performance",
            columns: AgentPerfCols
		};

		//Define Site Details
		var SiteDetailsCols = [
            {id: "siteName",alias:"LID",dataType: tableau.dataTypeEnum.string},
            {id: "siteCity",alias:"City",dataType: tableau.dataTypeEnum.string},
            {id: "siteState",alias:"State",dataType: tableau.dataTypeEnum.string},
            {id: "siteCountry",alias:"Country",dataType: tableau.dataTypeEnum.string},
            {id: "siteRegion",alias:"Region",dataType: tableau.dataTypeEnum.string}
        ];

        var SiteDetailsSchema = {
            id: "siteDetails",
            alias: "Site Details",
            columns: SiteDetailsCols
        };
        schemaCallback([userListSchema,adminListSchema,AgentPerfSchema,SiteDetailsSchema]);
	};
	
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
					getToken(accessData[acObj],table,doneCallback);
				}
			},
			'error': function(XMLHttpRequest, textStatus, errorThrown){
				console.log("Access Data request Failed");
				doneCallback()
			}
		});
	}

    //Function to request Access token
    function getToken(accessVariable,table,doneCallBack){
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
				if(table.tableInfo.id == "agentList"){dataRequestAgentList(accessVariable.cluster,result,table,doneCallBack);}
				if(table.tableInfo.id == "adminList"){dataRequestAdminList(accessVariable.cluster,result,table,doneCallBack);}
				if(table.tableInfo.id == "agentPerformance"){dataRequestAgentPerf(accessVariable.cluster,result,table,doneCallBack);}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
				--ajaxCallsRemaining
                console.log(cluster+" Error")
            }
        });
    }
    //Agent List Data Request
    function dataRequestAgentList(cluster, accessToken,table,doneCallBack){
        requestBody = {
            'updatedSince': '',
            'isActive': '',
            'searchString': '',
            'fields': 'agentId,firstName,lastName,emailAddress,isActive,teamId,teamName,reportToId,location,profileId,profileName,createDate,inactiveDate,internalId,isBillable',
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
				console.log(ajaxCallsRemaining+" Call Remain")
				if (ajaxCallsRemaining==0) {
					console.log("Execute Callback")
					table.appendRows(tableData)
					doneCallBack();
				}
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
				--ajaxCallsRemaining
                console.log(cluster+" Error")
            }
        });
    }
    //Admin List Data Request
    function dataRequestAdminList(cluster, accessToken,table,doneCallBack){
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
            '?startDate=' + startDate + '&endDate=' + endDate + '&includeHeaders=' + includeHeaders,
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
    //Agent Performance Data Request
    function dataRequestAgentPerf(cluster,accessToken,table,donecallback){
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
					tableData.push({
						"Cluster":cluster,
						"agentId":performList[record].agentId,
						"totalHandled":performList[record].totalHandled
					})
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
    //Site Details Data Request
    function dataRequestSiteDetails(table,doneCallBack){
        $.ajax({
			'type':'GET',
			'url':"./SiteDetails.csv",
			"dataType":"text",
            'timeout': 5*60*1000, //5 min timeout
            'success': function (result,status,statusCode){
                csvResult = result.replace(/['"]+/g,'')
                csvRows=csvResult.split(/\n/)
                for (csvRow=1;csvRow<csvRows.length;csvRow++){
                    //console.log(csvRows[csvRow])
                    rowData = []
                    siteDetails = csvRows[csvRow].split(",")
                    for (dataPoint=0;dataPoint<siteDetails.length;dataPoint++){
						//if(siteDetails[dataPoint].length<1){break;}
						//console.log(siteDetails[dataPoint])
                        rowData.push(siteDetails[dataPoint])
                    }
					tableData.push(rowData)
					//if (csvRow==3){break;}
				}
				table.appendRows(tableData)
				doneCallBack();
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                console.log(cluster+" Error")
            }
        });
    }



    // Download the data
    myConnector.getData = function(table, doneCallback) {
		console.log(table.tableInfo.id)
		if(table.tableInfo.id=="agentList"||table.tableInfo.id=="adminList"||table.tableInfo.id=="agentPerformance"){getAccessData(table,doneCallback)}
		if(table.tableInfo.id == "siteDetails"){dataRequestSiteDetails(table,doneCallback);}
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "NIC Users"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
