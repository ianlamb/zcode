function coordinate(x,y){
this.x_ = x;
this.y_ = y;
this.getX = function(){ return x_; };
this.getY = function(){ return y_; };
}
var point = coordinate(20,40);
var pointX = point.getX;