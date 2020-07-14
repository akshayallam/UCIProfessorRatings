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
		// extract last name from selected text to be used for initial search
		var lastName = getLast(clickData.selectionText);
		lastName = fixWhiteSpace(lastName);
		var rmpUrl = 'https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&queryoption=HEADER&facetSearch=true'
					+ '&query=' + lastName
					+ '&schoolName=university+of+california+irvine';
		// proxy needed to fetch
		var proxyUrl = 'https://cors-anywhere.herokuapp.com/';
		var profUrl = 'http://www.ratemyprofessors.com';
		var fullUrl = proxyUrl + rmpUrl;
		var link;
		var majorS = [];
		fetch(fullUrl).then(r => r.text()).then(result => {
			var newDiv = document.createElement('div'); 
			newDiv.innerHTML = result;
			checkArray = newDiv.getElementsByClassName('listing PROFESSOR');
			// no professors found for the last name
			if (checkArray.length == 0){
				alert("No professor found. \n\nThe professor's name may be incorrect on schedule of classes. \n\nIf not, the professor may not be available on RateMyProfessor.");
			}
			// if only one professor found, open their rmp page
			if (checkArray.length == 1){
				profUrl = profUrl + checkArray[0].getElementsByTagName('a')[0].getAttribute('href');
				chrome.tabs.create({ url: profUrl });
			}
			// if more than one professor found
			if (checkArray.length > 1) {
				// get list of professors
				majorArray = newDiv.getElementsByClassName('listing PROFESSOR');
				for (i = 0; i < majorArray.length; i++) {
					// get bio from professor
					var major = majorArray[i].getElementsByClassName('sub')[0].textContent;
					// extract major from sub/bio
					major = getMajor(major);
					majorS.push(major);
				}
				// remove duplicate majors
				majorS = uniqueArray2(majorS);
				var stepArray = newDiv.getElementsByClassName('step');
				if (!(stepArray.length > 0)){
					// sort majors alphabetically for better display
					departments = majorS.sort().join('\n');
					// prompt user for department choice
					var departmentInput = prompt("Select the professor's department from the list:\n\n* RateMyProfessor assigns departments differently from UCI for some professors *\n\n"+departments, majorS[0]);
					// if users presses cancel, stop running the program
					if (departmentInput === null) {
						return;
					}
					// encode department to be used for url
					var department = fixedEncodeURI(departmentInput);
					fullUrl = fullUrl + '&dept=' + department;
					fetch(fullUrl).then(r => r.text()).then(result => {
						var profDiv = document.createElement('div'); 
						profDiv.innerHTML = result;
						// get list of professors
						var profArray = profDiv.getElementsByClassName('listing PROFESSOR')
						// if profArray empty
						if (profArray.length == 0){
							alert("No ratings found. \n\nTry an alternative department. \n\nOtherwise, the professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
							return;
						}
						// if profArray only has a single item, check for matching, then open their rmp page
						if (profArray.length == 1){
							var profName = profArray[0].getElementsByClassName('main')[0].innerHTML;
							if ((parseName(profName) == parseName(clickData.selectionText)) || (parseName(flipName(profName)).replace(' ','') == parseName(clickData.selectionText))){
								profUrl = profUrl + profArray[0].getElementsByTagName('a')[0].getAttribute('href');
								chrome.tabs.create({ url: profUrl });
								return;
							}
						}
						// check if names match between uci and rmp 
						var count = 0;
						var index = 0;
						for (i = 0; i < profArray.length; i++) {
							var profName = profArray[i].getElementsByClassName('main')[0].innerHTML;
							if (parseName(profName) === parseName(clickData.selectionText)){
								count = count + 1;
								index = i;
							}
						}
						// if no matches
						if (count == 0){
							alert("No ratings found. \n\nTry an alternative department. \n\nOtherwise, the professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
						}
						// if multiple matches
						if (count > 1){
							// add department to url, and open rmp page of professors with same name and same department
							rmpUrl = rmpUrl + '&dept=' + department;
							chrome.tabs.create({ url: rmpUrl });
							alert("There are multiple professors with the same name.");
							return;
						}
						// if single match
						if (count == 1){
							// add prof id to url and open their rmp page
							profUrl = profUrl + profArray[index].getElementsByTagName('a')[0].getAttribute('href');
							chrome.tabs.create({ url: profUrl });
							return;
						}
					})
				}
				// if more than one page of professors
				if (stepArray.length > 0){
					// link for next page
					var linksArray = newDiv.getElementsByClassName('result-pager hidden-md')[0];
					link = linksArray.getElementsByTagName('a')[0].getAttribute('href');
					// link for second page of professors
					var secondUrl = proxyUrl + profUrl + link;
					fetch(secondUrl).then(r => r.text()).then(result => {
						var newDiv = document.createElement('div'); 
						newDiv.innerHTML = result;
						// get list of professors
						majorArray = newDiv.getElementsByClassName('listing PROFESSOR');
						for (i = 0; i < majorArray.length; i++) {
							// get bio from professor
							var major = majorArray[i].getElementsByClassName('sub')[0].textContent;
							// extract major from sub/bio
							major = getMajor(major);
							majorS.push(major)
						}
						// remove duplicate majors
						majorS = uniqueArray2(majorS);
						// sort majors alphabetically for better display
						departments = majorS.sort().join('\n');
						var departmentInput = prompt("Select the professor's department from the list:\n\n* RateMyProfessor assigns departments differently from UCI for some professors *\n\n"+departments, majorS[0]);
						// if users presses cancel, stop running the program
						if (departmentInput === null) {
							return;
						}
						// encode department to be used for url
						var department = fixedEncodeURI(departmentInput);
						fullUrl = fullUrl + '&dept=' + department;
						fetch(fullUrl).then(r => r.text()).then(result => {
							var profDiv = document.createElement('div'); 
							profDiv.innerHTML = result;
							// get list of professors
							var profArray = profDiv.getElementsByClassName('listing PROFESSOR')
							// if profArray empty
							if (profArray.length == 0){
								alert("No ratings found. \n\nTry an alternative department. \n\nOtherwise, the professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
								return;
							}
							// if profArray only has a single item, check for matching, then open their rmp page
							if (profArray.length == 1){
								var profName = profArray[0].getElementsByClassName('main')[0].innerHTML;
								if ((parseName(profName) == parseName(clickData.selectionText)) || (parseName(flipName(profName)).replace(' ','') == parseName(clickData.selectionText))){
									profUrl = profUrl + profArray[0].getElementsByTagName('a')[0].getAttribute('href');
									chrome.tabs.create({ url: profUrl });
									return;
								}
							}
							// check if names match between uci and rmp
							var count = 0;
							var index = 0;
							for (i = 0; i < profArray.length; i++) {
								var profName = profArray[i].getElementsByClassName('main')[0].innerHTML;
								if (parseName(profName) === parseName(clickData.selectionText)){
									count = count + 1;
									index = i;
								}
							}
							// if no matches
							if (count == 0){
								alert("No ratings found. \n\nTry an alternative department. \n\nOtherwise, the professor's name could be incorrect on schedule of classes or the professor is not available on RateMyProfessor.");
							}
							// if multiple matches
							if (count > 1){
								// add department to url, and open rmp page of professors with same name and same department
								rmpUrl = rmpUrl + '&dept=' + department;
								chrome.tabs.create({ url: rmpUrl });
								alert("There are multiple professors with the same name.");
								return;
							}
							// if single match
							if (count == 1){
								// add prof id to url and open their rmp page
								profUrl = profUrl + profArray[index].getElementsByTagName('a')[0].getAttribute('href');
								chrome.tabs.create({ url: profUrl });
								return;
							}
						})
					})
				}
			}
		})
    }
});

// gets last name from selected text to be used for intial URL
function getLast(nameSelected){
	var lastName = nameSelected.split(',')[0];
	return lastName.toUpperCase();
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

// used to check if last name has whitespaces, and replace with dash, to match RMP search
function fixWhiteSpace(lastName) {
	if(lastName.indexOf(' ') >= 0){
		lastName = lastName.replace(/ /g, "-");
	}
	return lastName;
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