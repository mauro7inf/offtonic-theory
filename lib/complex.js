function Complex(real, imag, inf) {
  this.real = real; // real part
  this.imag = imag; // imaginary part
  this.inf = inf; // multiplicity of infinity (0 for non-infinite, -1 for a simple zero, 1 for a simple pole)

  if (this.real === 0 && this.imag === 0) { // if the number passed in is actually 0, make it a simple zero with coefficient 1
    this.real = 1;
    this.inf--;
  }
}

Complex.prototype.magnitude = function () {
  if (this.inf < 0) {
    return 0;
  } else if (this.inf > 0) {
    return Infinity;
  } else if (isNaN(this.inf)) {
    return NaN;
  } else {
    return Math.sqrt(this.real*this.real + this.imag*this.imag);
  }
};

Complex.prototype.angle = function (zeroCenter) {
  let m = Math.atan2(this.imag, this.real);
  if (!zeroCenter && m < 0) {
    m += 2*Math.PI;
  }
  return m;
};

Complex.prototype.realPart = function () {
  return new Complex(this.real, 0, this.inf);
};

Complex.prototype.imagPart = function () {
  return new Complex(0, this.imag, this.inf);
};

Complex.prototype.conjugate = function () {
  if (this.inf !== 0) {
    return new Complex(1, 0, NaN); //TODO: implement something better?
  } else {
    return new Complex(this.real, -this.imag, this.inf);
  }
};

Complex.prototype.add = function (c) {
  if (this.inf > c.inf || isNaN(this.inf)) {
    return this;
  } else if (this.inf < c.inf || isNaN(c.inf)) {
    return c;
  } else {
    return new Complex(this.real + c.real, this.imag + c.imag, this.inf);
  }
};

Complex.prototype.negate = function () {
  return new Complex(-this.real, -this.imag, this.inf);
};

Complex.prototype.subtract = function (c) {
  return this.add(c.negate());
};

Complex.prototype.multiply = function (c) {
  return new Complex(this.real*c.real - this.imag*c.imag, this.real*c.imag + this.imag*c.real, this.inf + c.inf);
};

Complex.prototype.reciprocate = function () {
  let m = this.real*this.real + this.imag*this.imag
  return new Complex(this.real/m, -this.imag/m, -this.inf);
};

Complex.prototype.divide = function (c) {
  return this.multiply(c.reciprocate());
};

Complex.prototype.exp = function () {
  if (isNaN(this.inf)) {
    return new Complex(1, 0, NaN);
  } else if (this.inf > 0) {
    return new Complex(1, 0, NaN);
  } else if (this.inf < 0) {
    return new Complex(1, 0, 0);
  } else {
    let r = Math.exp(this.real);
    return (new Complex(r*Math.cos(this.imag), r*Math.sin(this.imag), 0));
  }
};

Complex.prototype.sin = function () {
  let eiz = this.multiply(new Complex(0, 1, 0)).exp();
  return eiz.subtract(eiz.reciprocate()).multiply(new Complex(0, -1/2, 0));
};

Complex.prototype.cos = function () {
  let eiz = this.multiply(new Complex(0, 1, 0)).exp();
  return eiz.add(eiz.reciprocate()).multiply(new Complex(1/2, 0, 0));
};

Complex.prototype.tan = function () {
  return this.sin().divide(this.cos());
};

Complex.prototype.csc = function () {
  return this.sin().reciprocate();
};

Complex.prototype.sec = function () {
  return this.cos().reciprocate();
};

Complex.prototype.cot = function () {
  return this.cos().divide(this.tan());
};

Complex.prototype.ln = function (zeroCenter) {
  if (isNaN(this.inf)) {
    return new Complex(1, 0, NaN);
  } else if (this.inf > 0) {
    return new Complex(1, 0, 1);
  } else if (this.inf < 0) {
    return new Complex(1, 0, 1);
  } else {
    return new Complex(Math.log(this.magnitude()), this.angle(zeroCenter), 0);
  }
};

Complex.prototype.exponentiate = function (c, zeroCenter) {
  if (isNaN(this.inf) || c.inf !== 0) {
    return new Complex(1, 0, NaN);
  } else if (this.inf !== 0) {
    if (isNaN(c.inf) || c.imag != 0) {
      return new Complex(1, 0, NaN);
    }
    let coeff = (new Complex(this.real, this.imag, 0)).exponentiate(c, zeroCenter);
    if (isNaN(coeff.inf)) {
      return new Complex(1, 0, NaN);
    } else {
      return new Complex(coeff.real, coeff.imag, this.inf*c.real + coeff.inf);
    }
  } else {
    return this.ln(zeroCenter).multiply(c).exp();
  }
}