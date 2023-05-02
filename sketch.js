let passenger_nums = 50;
let ticketGate_nums = [100, 160, 220, 280];
let r = 10; //diameter

let ticketGates = [];
let passengers = [];

let counter = 0;
let second = 0;
let efficiency = 0;

function setup() {
  createCanvas(400, 600);

  //creating TicketGate objects
  for (let i = 0; i < ticketGate_nums.length; i++) {
    ticketGates[i] = new TicketGate(ticketGate_nums[i], (height/2)-50);
  }

  //creating Passenger objects
  for (let i = 0; i < passenger_nums; i++) {
    let already_created = false;
    while (!already_created) {
      already_created = true;

      passengers[i] = new Passenger(random(0, width), random(-200, 0), random(0, width), height+1000);
      let i_x = passengers[i].passenger_pos.x;
      let i_y = passengers[i].passenger_pos.y;

      for (let j = 0; j < i; j++) {
        let j_x = passengers[j].passenger_pos.x;
        let j_y = passengers[j].passenger_pos.y;
        if (abs(i_x - j_x) <= 2*r && abs(i_y - j_y) <= 2*r) {
          already_created = false;
        }
      }
    }
  }
}

function draw() {
  background(255);

  //the inside and outside of the gate
  // fill(200);
  // textSize(20);
  // text("OUTSIDE", 160, 20);
  // fill(200);
  // textSize(20);
  // text("INSIDE", 160, height-20);

  //y座標でpassengersをソート
  for (let i = 0; i < passenger_nums; i++) {
    for (let j = passenger_nums-1; j > i; j--) {
      if (passengers[j-1].passenger_pos.y < passengers[j].passenger_pos.y) {
        let p_memo = passengers[j-1];
        passengers[j-1] = passengers[j];
        passengers[j] = p_memo;
      }
    }
  }

  //counting time
  let finish = true;
  for (let i = 0; i < passenger_nums; i++) {
    if (passengers[i].passenger_pos.y < height) {
      finish = false;
    }
  }
  if (finish == false) {
    counter = counter + 1;
  } else {
    efficiency = passenger_nums/second;
  }
  second = round(counter/32);
  fill(0); //text color = 0
  textSize(20);
  // text("Time: " + second, 20, 500);
  // text("Efficiency: " + efficiency, 20, 530);

  //calling TicketGate functions
  for (let i = 0; i < ticketGate_nums.length; i++) {
    ticketGates[i].update();
    ticketGates[i].display();
  }

  //calling Passenger functions
  for (let i = 0; i < passenger_nums; i++) {
    passengers[i].update();
    passengers[i].display();
  }
  //saveFrame("output/br_####.png"); //for Movie Maker
}

class Passenger {
  constructor(xpos, ypos, dest_xpos, dest_ypos) {
    this.passenger_pos = createVector(xpos, ypos);
    this.x_axis = createVector(1, 0);
    this.dest_pos = createVector(dest_xpos, dest_ypos);
    this.angle = 0;
    this.speed = 0;
    this.init_speed = random(1, 1.5);
    this.desired_gate_index = 0;
  }

  canIMove(ang) {
    let able = true;
    let personal_space_direction = 10;
    let vel = createVector(cos(ang), sin(ang));
    let pos = createVector(this.passenger_pos.x, this.passenger_pos.y);
    vel.mult(personal_space_direction);
    let collision_detection_vector = pos.add(vel);

    for (let other = 0; other < passenger_nums; other++) {
      if (this == passengers[other]) {
        continue;
      }
      let passenger_other_dist = p5.Vector.dist(collision_detection_vector, passengers[other].passenger_pos);

      if (passenger_other_dist <= r + 5) {
        able = false;
      }
    }
    return able;
  }

  canMoveInDirection(gateIndex) {
    let dest_passenger = p5.Vector.sub(ticketGates[gateIndex].entrance_pos, this.passenger_pos);
    let ang = p5.Vector.angleBetween(dest_passenger, this.x_axis);
    let able = this.canIMove(ang);

    return able;
  }

  anotherGate() {
    let base_count = ticketGates[this.desired_gate_index].current_waiting_count;
    let temporary_index = this.desired_gate_index;

    for (let i = 1; i <= max(this.desired_gate_index, ticketGates.length - 1 - this.desired_gate_index); i++) {
      if (this.desired_gate_index - i >= 0) {
        let current = ticketGates[this.desired_gate_index - i].current_waiting_count;
        if ((base_count - current) > 2 * i && this.canMoveInDirection(i)) {
          temporary_index = this.desired_gate_index - i;
          base_count = current + 2 * i;
          break;
        }
      }
      if (this.desired_gate_index + i <= ticketGates.length - 1) {
        let current = ticketGates[this.desired_gate_index + i].current_waiting_count;
        if ((base_count - current) > 2 * i && this.canMoveInDirection(i)) {
          temporary_index = this.desired_gate_index + i;
          base_count = current + 2 * i;
          break;
        }
      }
    }
    this.desired_gate_index = temporary_index;

  }

  determineMotion() {
    let can_i_move = this.canIMove(this.angle);
    if (can_i_move) {
      this.speed = this.init_speed;
    } else {
      this.speed = -0.01;
    }
  }

  getAngle(destination) {
    let dest_passenger = p5.Vector.sub(destination, this.passenger_pos);
    this.angle = p5.Vector.angleBetween(this.x_axis, dest_passenger);
    return this.angle;
  }

  selectGate() {
    let shortest_distance = 1000.0;

    for (let i = 0; i < ticketGate_nums.length; i++) {
      let current_distance = p5.Vector.dist(ticketGates[i].entrance_pos, this.passenger_pos);
      if (current_distance < shortest_distance) {
        shortest_distance = current_distance;
        this.desired_gate_index = i;
      }
    }  
    if(ticketGates[this.desired_gate_index].current_waiting_count > 4){
      this.anotherGate();
    }
  }
  
  movePassenger(agl) {
    let velocity = createVector(cos(agl), sin(agl));
    let pre_passenger_pos = createVector(this.passenger_pos.x, this.passenger_pos.y);
    velocity.mult(this.speed);
    this.passenger_pos.add(velocity);
    if (this.passenger_pos.y >= ticketGates[this.desired_gate_index].entrance_pos.y && this.passenger_pos.y <= ticketGates[this.desired_gate_index].exit_pos.y) {
      if (ticketGates[this.desired_gate_index].if_passing == false) {
        let target_Height = ticketGates[this.desired_gate_index].entrance_pos.y + ticketGates[this.desired_gate_index].gateHeight / 2;
        if (pre_passenger_pos.y <= target_Height && this.passenger_pos.y > target_Height) {
          ticketGates[this.desired_gate_index].passed_passengers_count++;
        }
        ticketGates[this.desired_gate_index].if_passing = true;
      } else if (ticketGates[this.desired_gate_index].if_passing == true) {
        velocity.mult(-1);
        this.passenger_pos.add(velocity);
      }
    }
  }
  
  update() {
  
    this.selectGate();
    this.determineMotion();

    if ((this.passenger_pos.y <= ticketGates[this.desired_gate_index].entrance_pos.y)) { // && (passenger_pos.y > ticketGates[desired_gate_index].entrance_pos.y - 2*r)
      ticketGates[this.desired_gate_index].current_waiting_count++;
      this.getAngle(ticketGates[this.desired_gate_index].entrance_pos);
      this.movePassenger(this.angle);
    } else if ((this.passenger_pos.y > ticketGates[this.desired_gate_index].entrance_pos.y) && (this.passenger_pos.y <= ticketGates[this.desired_gate_index].exit_pos.y )) {
      this.getAngle(ticketGates[this.desired_gate_index].exit_pos);
      this.movePassenger(this.angle);
      this.determineMotion();
    } else {
      this.getAngle(this.dest_pos);
      this.movePassenger(this.angle);
      this.determineMotion();
    }
  }

  display() {
    fill(0);
    circle(this.passenger_pos.x, this.passenger_pos.y, r);
    line(this.passenger_pos.x, this.passenger_pos.y, this.passenger_pos.x + r*cos(this.angle), this.passenger_pos.y + r*sin(this.angle));
  }
}

class TicketGate {
  constructor(xpos, ypos) {
    this.entrance_pos = createVector(xpos, ypos);
    this.gateWidth = 15;
    this.gateHeight = 35;
    this.exit_pos = createVector(xpos, ypos + this.gateHeight);
    this.if_passing = false;
    this.passed_passengers_count = 0;
    this.current_waiting_count = 0;
  }
  
  update() {
    this.if_passing = false;
  }

  display() {
    stroke(0);
    strokeWeight(2);
    fill(255);
    rect(this.entrance_pos.x - this.gateWidth/2, this.entrance_pos.y + 10, this.gateWidth, this.gateHeight);
    fill(200);
    textSize(20);
    // text(this.current_waiting_count, this.entrance_pos.x - this.gateWidth/2, this.entrance_pos.y - this.gateHeight/2);
    // text(this.passed_passengers_count, this.entrance_pos.x - this.gateWidth/2, this.entrance_pos.y + this.gateHeight * 2);
    this.current_waiting_count = 0;
  }
}