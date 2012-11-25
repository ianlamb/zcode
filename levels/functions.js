//function with return
function myFunction() {
var x=5;
return x;
}
var myVar=myFunction();

//function with params
function myFunction(a,b) {
return a*b;
}
document.getElementById("demo").innerHTML=myFunction(4,3);