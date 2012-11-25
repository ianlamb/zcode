//for loop
for(var i = 0; i < cars.length; i++) { 
document.write(cars[i] + "<br>");
}

//for/in loop
var person={fname:"John", lname:"Doe", age:25}; 
for(x in person) {
txt=txt + person[x];
}

//while loop
while(i < 5) {
x=x + "The number is " + i + "<br>";
i++;
}

//do while loop
do {
x = x + "The number is " + i + "<br>";
i++;
} while(i<5);