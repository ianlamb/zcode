function validateForm()
{
var x = document.forms["myForm"]["fname"].value;
if(x == null || x == "")
{
alert("Validation Error");
return false;
}
}