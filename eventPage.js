// context menu for right click
var menu = {
    "id": "UCI Professor Ratings",
    "title": "UCI Professor Ratings",
    "contexts": ["selection"]
};
chrome.contextMenus.create(menu);

chrome.contextMenus.onClicked.addListener(function(clickData){  
	// when clicked on "UCI Professor Ratings" in the context menu
	if (clickData.menuItemId == "UCI Professor Ratings" && clickData.selectionText){  
		// get selected texted
		var pName = clickData.selectionText;
		// start search
		runSearch(pName);
	}
});

// gets last name from selected text, replace white spaces with dash to be used for intial URL
function getLast(nameSelected){
	var lastName = nameSelected.split(',')[0];
	lastName = lastName.toUpperCase();
	if(lastName.indexOf(' ') >= 0){
		lastName = lastName.replace(/ /g, "-");
	}
	return lastName;

}

// parses name from RMP and UCI to be last name first initial format for matching purposes
function parseName(name){
	var lastName = name.split(',')[0];
	if (lastName.includes('-')){
		lastName = lastName.replace("-", " ");
	}
	var firstInitial = name.split(',')[1][1];
	var formatted = lastName + ' ' + firstInitial;
	return formatted.toLowerCase();
}

// encodes string to be concatenated to url 
function fixedEncodeURI(str){
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']').replace(',','%2C');
}

// extract major from sub class/bio
function getMajor(sub){
	var major = sub.split(',')[1].substring(1);
	return major;
}

// get unique values in array (other fucntion weren't working) (duplicates majors)
function uniqueArray2(arr) {
    var a = [];
    for (var i=0, l=arr.length; i<l; i++)
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
            a.push(arr[i]);
    return a;
}

// reverse first and last name (used for few scenarios)
function flipName(name){
	var newName = name.split(',');
	var reversed = newName[1].substring(1) + ', ' + newName[0];
	return reversed;
}

// removes extra white space characters if they were added during copy and paste
function fixDepartment(department){
	if (department.substring(department.length-3) == '%0A'){
		department = department.substring(0, department.length-3);
	}
	return department
}

// adds to the majorList and profList if name matches with rmp, removes duplicate majors
function addProfMajor(majorArray, pName, majorList, profList){
	for (i = 0; i < majorArray.length; i++) {
		// get prof name
		var profName = majorArray[i].getElementsByClassName('main')[0].innerHTML;
		// check to see which majors match the name and which professors match between uci and rmp
		if ((parseName(profName) == parseName(pName) || (parseName(flipName(profName)).replace(' ','') == parseName(pName)))){
			// get bio from professor
			var bio = majorArray[i].getElementsByClassName('sub')[0].textContent;
			// extract major from sub/bio
			var major = getMajor(bio);
			// add major to list of majors
			majorList.push(major);
			// add prof to list of professors
			profList.push(i);
		}
	}
	// remove duplicate majors
	majorList = uniqueArray2(majorList);
	return majorList;
}

// prompt user for department choice, encode, and return it
function deptPrompt(majorList){
	// sort majors alphabetically for better display
	departments = majorList.sort().join('\n');
	// prompt user for department choice
	var departmentInput = prompt("* If none of the department choices match with the professor's, RateMyProfessor either listed them under one of those departments or the professor is not available on RateMyProfessor. *\n\nSelect the professor's department from the list:\n\n"+departments, majorList[0]);
	// if users presses cancel, stop running the program
	if (departmentInput === null) {
		return;
	}
	// encode department to be used for url
	var department = fixedEncodeURI(departmentInput);
	return department;
}

// if only one match with rmp, open their rmp page
function oneMatch(profList, majorArray, profUrl){
	if (profList.length == 1){
		index = profList[0]
		// append professor specific href to rmp homepage url, and open it
		profUrl = profUrl + majorArray[index].getElementsByTagName('a')[0].getAttribute('href');
		chrome.tabs.create({ url: profUrl });
		return 1;
	}
}

// if lastname has no listings in dept, checks if name matches with the department looking for, opens if exists, if not opens lastname url
function emptyProf(majorArray, department, pName, profUrl, rmpUrl){
	var count = 0;
	var index = 0;
	for (i = 0; i < majorArray.length; i++) {
		var profName = majorArray[i].getElementsByClassName('main')[0].innerHTML;
		var bio = majorArray[i].getElementsByClassName('sub')[0].textContent;
		var major = getMajor(bio);
		// check if major matches input and profname is in rmp
		if (major == fixDepartment(department) && (parseName(profName) == parseName(pName) || (parseName(flipName(profName)).replace(' ','') == parseName(pName)))){
			count = count + 1
			index = i
		}
		// if theres a match, append professor specific href to rmp homepage url, and open it
		if (count == 1){
			profUrl = profUrl + majorArray[index].getElementsByTagName('a')[0].getAttribute('href');
			chrome.tabs.create({ url: profUrl });
			return 1;
		}
	}
	// no matches, then open tab of professors with same last name
	chrome.tabs.create({ url: rmpUrl }); 
	alert("RateMyProfessor cannot identify the exact professor. \n\nHope the professor is one of these.");
	return 1;
}

// if lastname has multiple listings in dept, checks if name matches, opens if exists, if not opens lastname url
function multipleResults(profArray, pName, rmpUrl, department, profUrl){
	var count = 0;
	var index = 0;
	for (i = 0; i < profArray.length; i++) {
		var profName = profArray[i].getElementsByClassName('main')[0].innerHTML;
		// checks if profName is in rmp
		if ((parseName(profName) == parseName(pName) || (parseName(flipName(profName)).replace(' ','') == parseName(pName)))){
			count = count + 1;
			index = i;
		}
	}

	// if multiple matches
	if (count > 1){
		// add department to url, and open rmp page of professors with same name and same department
		rmpUrl = rmpUrl + '&dept=' + department;
		chrome.tabs.create({ url: rmpUrl });
		alert("There are multiple professors with the same name in that department. \n\nHope the professor is one of these.");
		return 1;
	}

	// if single match
	if (count == 1){
		// if theres a match, append professor specific href to rmp homepage url, and open it
		profUrl = profUrl + profArray[index].getElementsByTagName('a')[0].getAttribute('href');
		chrome.tabs.create({ url: profUrl });
		return 1;
	}
}

function runSearch(pName){
	// gets last name from selected text, replace white spaces with dash to be used for intial URL
	var lastName = getLast(pName);
	var rmpUrl = 'https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&queryoption=HEADER&facetSearch=true'
				+ '&query=' + lastName
				+ '&schoolName=university+of+california+irvine';

	// proxy needed to fetch
	var proxyUrl = 'https://cors-anywhere.herokuapp.com/';

	var profUrl = 'http://www.ratemyprofessors.com';
	var fullUrl = proxyUrl + rmpUrl;
	var majorList = [];
	var profList = [];

	// fetch url with last name
	fetch(fullUrl).then(r => r.text()).then(result => {
		var newDiv = document.createElement('div'); 
		newDiv.innerHTML = result;

		// get list of professors
		var numProfArray = newDiv.getElementsByClassName('listing PROFESSOR');

		// no professors found for the last name
		if (numProfArray.length == 0){
			alert("No professor found. \n\nThe professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
			return;
		}

		// if more than one professor found
		if (numProfArray.length > 0) {
			
			// get list of professors
			var majorArray = newDiv.getElementsByClassName('listing PROFESSOR');

			// adds to the majorList and profList if name matches with rmp, removes duplicate majors
			majorList = addProfMajor(majorArray, pName, majorList, profList);

			// check if there are more than 1 page of results, in order to grab all majors?
			var stepArray = newDiv.getElementsByClassName('step');
			if (!(stepArray.length > 0)){

				// if only one match with rmp, open their rmp page
				if (oneMatch(profList, majorArray, profUrl)){
					return;
				}

				// check if there any majors that correlate to the name to see if match exists
				if (majorList.length == 0){
					alert("No professor found. \n\nThe professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
					return;
				}

				// prompt user for department choice, encode, and return it
				var department = deptPrompt(majorList);
				if (department == null){
					return;
				}

				fullUrl = fullUrl + '&dept=' + department;
				// fetch url with department
				fetch(fullUrl).then(r => r.text()).then(result => {
					var profDiv = document.createElement('div'); 
					profDiv.innerHTML = result;

					// get list of professors
					var profArray = profDiv.getElementsByClassName('listing PROFESSOR')

					// if lastname has no listings in dept, checks if name matches with the department looking for, opens if exists, if not opens lastname url
					if (profArray.length == 0){
						// checks if name matches with the department looking for
						if (emptyProf(majorArray, department, pName, profUrl, rmpUrl)){
							return;
						}
					}

					// if lastname has multiple listings in dept, checks if name matches, opens if exists, if not opens lastname url
					if (profArray.length > 0){
						if (multipleResults(profArray, pName, rmpUrl, department, profUrl)){
							return;
						}
					}
				})
			}

			// if more than one page of professors
			if (stepArray.length > 0){

				// link for next page
				var linksArray = newDiv.getElementsByClassName('result-pager hidden-md')[0];
				var link = linksArray.getElementsByTagName('a')[0].getAttribute('href');

				// link for second page of professors
				var secondUrl = proxyUrl + profUrl + link;
				fetch(secondUrl).then(r => r.text()).then(result => {
					var newDiv = document.createElement('div'); 
					newDiv.innerHTML = result;

					// get list of professors
					majorArray = newDiv.getElementsByClassName('listing PROFESSOR');

					// adds to the majorList and profList if name matches with rmp, removes duplicate majors
					majorList = addProfMajor(majorArray, pName, majorList, profList);

					// if only one match with rmp, open their rmp page
					if (oneMatch(profList, majorArray, profUrl)){
						return;
					}

					// check if there any majors that correlate to the name to see if match exists
					if (majorList.length == 0){
						alert("No professor found. \n\nThe professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
						return;
					}

					// prompt user for department choice, encode, and return it
					department = deptPrompt(majorList);
					if (department == null){
						return;
					}

					fullUrl = fullUrl + '&dept=' + department;
					// fetch url with last department 
					fetch(fullUrl).then(r => r.text()).then(result => {
						var profDiv = document.createElement('div'); 
						profDiv.innerHTML = result;
						
						// get list of professors
						var profArray = profDiv.getElementsByClassName('listing PROFESSOR')

						// if lastname has no listings in dept, checks if name matches with the department looking for, opens if exists, if not opens lastname url
						if (profArray.length == 0){
							// checks if name matches with the department looking for
							if (emptyProf(majorArray, department, pName, profUrl, rmpUrl)){
								return;
							}
						}

						// if lastname has multiple listings in dept, checks if name matches, opens if exists, if not opens lastname url
						if (profArray.length > 0){
							if (multipleResults(profArray, pName, rmpUrl, department, profUrl)){
								return;
							}
						}
					})
				})
			}
		}
	})
};