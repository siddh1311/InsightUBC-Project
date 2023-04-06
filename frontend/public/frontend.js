let datasetId;

document.getElementById("query-button").addEventListener("click", handleQuery);
document.getElementById("dataset-button").addEventListener("click", handleAddDataset);

function handleQuery() {
	const queryValue = document.getElementById('query').value;
	const query = {
		"WHERE": {
			"GT": {
				[datasetId + "_avg"]: parseFloat(queryValue)
			}
		},
		"OPTIONS": {
			"COLUMNS": [
				datasetId + "_dept",
				datasetId + "_id",
				datasetId + "_uuid",
				datasetId + "_avg"
			]
		}
	};
	fetch("/query", {
		method: "POST",
		body: JSON.stringify(query),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	})
	.then((response) => response.json())
	.then((json) => {
		const keys = Object.keys(json);
		const response = json[keys[0]];
		if (keys[0] === "result") {
			let responseString = "";
			for (const section of response) {
				const course = section[datasetId + "_dept"].toUpperCase() + " " + section[datasetId + "_id"]
				const sectionId = section[datasetId + "_uuid"]
				const avg = section[datasetId + "_avg"]
				responseString += "Course: " + course + ", Section ID: " + sectionId + ", Average: " + avg + "<br>"
			}
			document.getElementById("queryResponse").innerHTML = responseString;
		} else {
			document.getElementById("queryResponse").innerHTML = "Error: " + response;
		}
	});
}

function handleAddDataset() {
	const newDataset = document.getElementById('myFile').files[0];
	const newDatasetId = document.getElementById('datasetId').value;
	fetch("/dataset/" + newDatasetId + "/sections", {
		method: "PUT",
		body: newDataset,
		headers: {
			'Content-Type': 'application/zip'
		}
	})
		.then((response) => response.json())
		.then((json) => {
			const keys = Object.keys(json);
			const response = json[keys[0]];
			if (keys[0] === "result") {
				document.getElementById("addDatasetResponse").innerHTML = "Dataset added: " + newDatasetId + "<br>";
				// 1. Create the button
				const button = document.createElement("button");
				button.innerHTML = "Use this dataset for future queries";

				// 2. Append somewhere
				const addDatasetResponse = document.getElementById("addDatasetResponse");
				addDatasetResponse.appendChild(button);

				// 3. Add event handler
				button.addEventListener ("click", function() {
					datasetId = newDatasetId
					button.remove()
				});
			} else {
				document.getElementById("addDatasetResponse").innerHTML = "Error: " + response;
			}
		});
}
