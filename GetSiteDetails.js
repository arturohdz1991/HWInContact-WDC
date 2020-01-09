(function() {
    //Declare Global Variables
    var tableData = []
    // Create the connector object
    var myConnector = tableau.makeConnector();
    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var cols = [
            {id: "siteName",alias:"LID",dataType: tableau.dataTypeEnum.string},
            {id: "siteCity",alias:"City",dataType: tableau.dataTypeEnum.string},
            {id: "siteState",alias:"State",dataType: tableau.dataTypeEnum.string},
            {id: "siteCountry",alias:"Country",dataType: tableau.dataTypeEnum.string},
            {id: "siteRegion",alias:"Region",dataType: tableau.dataTypeEnum.string},
            {id: "lat",dataType: tableau.dataTypeEnum.int},
            {id: "long",dataType: tableau.dataTypeEnum.int}
        ];

        var tableSchema = {
            id: "siteDetails",
            alias: "Site Details",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };
    //Function to request data
    function dateRequest(table,doneCallBack){
        $.ajax({
			'type':'GET',
			'url':"./SiteDetails.csv",
			"dataType":"text",
            'timeout': 5*60*1000, //5 min timeout
            'success': function (result,status,statusCode){
                csvResult = result
                csvRows=csvResult.split(/\n/)
                for (csvRow=1;csvRow<csvRows.length;csvRow++){
                    console.log(csvRows[csvRow])
                    rowData = []
                    siteDetails = csvRows[csvRow].split(",")
                    for (dataPoint=0;dataPoint<siteDetails.length;dataPoint++){
						if(siteDetails[dataPoint].length<1){break;}
						console.log(siteDetails[dataPoint])
                        rowData.push(siteDetails[dataPoint])
                    }
					tableData.push(rowData)
					if (csvRow==3){break;}
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
		dateRequest(table,doneCallback);
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "Site Details"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
