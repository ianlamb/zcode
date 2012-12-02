function validateEmail(email) 
{
var regexPattern = /\S+@\S+\.\S+/;
return regexPattern.test(email);
}