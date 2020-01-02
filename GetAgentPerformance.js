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
    // Create the connector object
    var myConnector = tableau.makeConnector();
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
                callback(accessVariable.cluster,result);
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                //document.getElementById("result").innerHTML += "<br>1:" + JSON.stringify(errorThrown);
                callback(null);
            }
        });
    }
    //Function to request data
    function dataRequest(cluster, accessToken){
		today = new Date ()
		startDate = new Date(today.setDate(-10))
        endDate = today

        requestBody = {
            'startDate':startDate.toISOString(),
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
            'success': function (result,status,statusCode){
                //document.getElementById("result").innerHTML = Array.isArray(result.agents)
                performList = result.agentPerformance
                for (record in performList){
                    rowData = []
                    rowData.push(cluster)
                    agentDetails = performList[record]
                    for (dataPoint in agentDetails){
                        rowData.push(agentDetails[dataPoint])
                    }
                    tableData.push(rowData)
                }
                //document.getElementById("result").innerHTML += "<br>2:" + tableData
            },
            'error': function(XMLHttpRequest, textStatus, errorThrown){
                document.getElementById("result").innerHTML = "<br>2:" +JSON.stringify(textStatus);
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
        }, 10000);
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
