// requires complex.js
function CGrapher(div) {
  this.div = div;

  this.defaultFormulaString = '(zz+z\')/(z-z\'z\')';

  this.setupHtml();

  this.ctx = this.canvas.getContext('2d');

  this.w = 780; // image dimensions
  this.h = 780;

  this.offsetX = 0; // image location within canvas
  this.offsetY = 64;

  this.centerX = this.w/2; // where 0 is in image coordinates
  this.centerY = this.h/2;

  this.unitCircleThickness = 6; // how wide the annulus representing the unit circle is

  this.zoomButton = new ZoomButton(373, this.offsetY - 54, 220, 44, 10, 5, this);
  this.contoursButton = new ContoursButton(603, this.offsetY - 54, 176, 44, 10, 4, this);

  this.setupEvents();

  this.zoomScalesIndex = 3;
  this.zoomButton.selected = this.zoomScalesIndex;

  this.drawMagnitudeContours = true; // whether to draw the contour lines and gradations of color
  this.drawAngleContours = true;
  this.contoursButton.selected = 3;

  this.setupButtonImages();

  this.uh = 210; // height of auxilliary unit circle graph
  this.uw = this.w;
  this.uOffsetX = this.offsetX;
  this.uOffsetY = this.offsetY + this.h + 10;

  this.uDbHeight = 40; // height of auxiliary graph in db
  this.uCenterX = this.uw/2;
  this.uCenterY = this.uh/2;

  this.un = 2*this.uw + 1; // number of points in calculation

  //TODO: control for this, though... is it really necessary?
  this.zeroCenter = true; // whether 0 is the center for the angle of a complex number -- meaning whether the range is (0, 2π] or (–π, π]

  this.essentialSingularityPattern = null;
  this.essentialSingularityPatternWidth = 20;
  this.setupEssentialSingularityPattern();

  this.graph();
}

CGrapher.zoomScales = [1, 20, 60, 180, 360];

CGrapher.prototype.setupHtml = function () {
  this.formulaDiv = document.createElement('div');
  this.formulaDiv.className = 'cgrapher-formula-div';
  this.div.appendChild(this.formulaDiv);

  this.formulaDiv.innerHTML = "<em>f</em>(<em>z</em>) = "

  this.formulaBox = document.createElement('input');
  this.formulaBox.type = 'text';
  this.formulaBox.size = 52;
  this.formulaBox.className = 'cgrapher-formula-box';
  this.formulaBox.value = this.defaultFormulaString;
  this.formulaDiv.appendChild(this.formulaBox);

  this.submitButton = document.createElement('button');
  this.submitButton.innerHTML = 'Graph';
  this.submitButton.className = 'cgrapher-formula-submit';
  this.formulaDiv.appendChild(this.submitButton);

  this.canvasDiv = document.createElement('div');
  this.canvasDiv.className = 'cgrapher-canvas-div';
  this.div.appendChild(this.canvasDiv);

  this.canvas = document.createElement('canvas');
  this.canvas.width = 780;
  this.canvas.height = 1064;
  this.canvasDiv.appendChild(this.canvas);
};

CGrapher.prototype.setupEvents = function () {
  this.submitButton.addEventListener('click', this.graph.bind(this));
  this.formulaBox.addEventListener('keydown', (function (e) {
    if (e.code === 'Enter') {
      this.graph();
    }
  }).bind(this), true);

  this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
  this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
};

CGrapher.prototype.onMouseUp = function (e) {
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.zoomButton.isInButton(x, y)) {
    this.zoomButton.onMouseUp(x, y);
  } else if (this.contoursButton.isInButton(x, y)) {
    this.contoursButton.onMouseUp(x, y);
  }
};

CGrapher.prototype.onMouseDown = function (e) {
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.zoomButton.isInButton(x, y)) {
    this.zoomButton.onMouseDown(x, y);
  } else if (this.contoursButton.isInButton(x, y)) {
    this.contoursButton.onMouseDown(x, y);
  }
};

CGrapher.prototype.graph = function () {
  this.formulaString = this.formulaBox.value;
  this.formula = this.createFormula(this.formulaString);
  this.draw();
};

CGrapher.prototype.changeZoom = function (n) {
  this.zoomScalesIndex = n;
  this.zoomButton.selected = this.zoomScalesIndex;
  this.draw();
};

CGrapher.prototype.changeContours = function (drawMagnitudeContours, drawAngleContours) {
  this.drawMagnitudeContours = drawMagnitudeContours;
  this.drawAngleContours = drawAngleContours
  if (drawMagnitudeContours && drawAngleContours) {
    this.contoursButton.selected = 3;
  } else if (drawMagnitudeContours) {
    this.contoursButton.selected = 1;
  } else if (drawAngleContours) {
    this.contoursButton.selected = 2;
  } else {
    this.contoursButton.selected = 0;
  }
  this.draw();
}

CGrapher.prototype.createFormula = function (formulaString) {
  const errorFormula = function (z) {
    return new Complex(1, 0, 1);
  };
  let tokens = CGrapher.tokenize(formulaString);
  if (tokens === null) {
    return errorFormula;
  }
  //console.log(tokens);
  let tree = CGrapher.assembleTree(tokens);
  //console.log(tree);
  let ff = this.compileFunction(tree);
  if (ff !== null) {
    return ff;
  } else {
    return errorFormula;
  }
};

CGrapher.namedFunctions = ['exp', 'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'ln'];
CGrapher.namedConstants = ['pi', 'tau'];
CGrapher.characterTokens = '()izeπ+-*/\'^';
CGrapher.numberSymbols = '0123456789.';
CGrapher.whiteSpaceRegex = new RegExp('^\\s$'); //TODO: make whitespace into a grouping symbol

CGrapher.tokenize = function (formulaString) {
  let tokens = [];
  let currentToken = '';
  for (let i = 0; i < formulaString.length; i++) {
    let substring = formulaString.substring(i);
    let foundFunction = false;
    for (let j = 0; j < CGrapher.namedFunctions.length; j++) {
      if (substring.indexOf(CGrapher.namedFunctions[j] + '(') === 0) {
        if (currentToken !== '') {
          tokens.push(parseFloat(currentToken));
          currentToken = '';
        }
        tokens.push(CGrapher.namedFunctions[j]);
        i += CGrapher.namedFunctions[j].length - 1;
        foundFunction = true;
        break;
      }
    }
    if (foundFunction) {
      continue;
    }
    let foundConstant = false;
    for (let j = 0; j < CGrapher.namedConstants.length; j++) {
      if (substring.indexOf(CGrapher.namedConstants[j]) === 0) {
        if (currentToken !== '') {
          tokens.push(parseFloat(currentToken));
          currentToken = '';
        }
        tokens.push(CGrapher.namedConstants[j]);
        i += CGrapher.namedConstants[j].length - 1;
        foundConstant = true;
        break;
      }
    }
    if (foundConstant) {
      continue;
    }
    let c = formulaString[i];
    if (CGrapher.characterTokens.includes(c)) {
      if (currentToken !== '') {
        tokens.push(parseFloat(currentToken));
        currentToken = '';
      }
      tokens.push(c);
    } else if (CGrapher.numberSymbols.includes(c)) {
      currentToken += c;
    } else if (CGrapher.whiteSpaceRegex.test(c)) { // ignore white space except to separate tokens
      if (currentToken !== '') {
        tokens.push(parseFloat(currentToken));
        currentToken = '';
      }
    } else {
      return null;
    }
  }
  if (currentToken !== '') {
    tokens.push(parseFloat(currentToken));
  }
  return tokens;
};

// each node has a set of elements, which start out unparsed and may be other nodes
CGrapher.assembleTree = function (tokens) {
  let rootNode = {elements: tokens};
  CGrapher.collectParentheses(rootNode);
  CGrapher.parseFunctions(rootNode);
  CGrapher.parseConjugations(rootNode);
  CGrapher.insertMultiplications(rootNode);
  CGrapher.parseExponentiation(rootNode); // should think about how this plays with the inserted multiplications, since ab^cd likely means a·b^(cd)
  CGrapher.parseMultiplicationsAndDivisions(rootNode);
  CGrapher.parseUnaryNegatives(rootNode);
  CGrapher.parseAdditionsAndSubtractions(rootNode);
  return rootNode;
};

CGrapher.printNode = function printNode(node) {
  if (typeof node === 'object') {
    if (node.elements === null) {
      return 'null';
    } else {
      return '[' + node.elements.map(e => printNode(e)).join(',') + ']';
    }
  } else {
    return '' + node;
  }
}

CGrapher.collectParentheses = function collectParentheses(node) {
  if (node.elements === null) {
    return;
  }
  // find innermost parentheses
  let leftIndex = null;
  let rightIndex = null;
  for (let i = 0; i < node.elements.length; i++) {
    if (node.elements[i] === '(') {
      leftIndex = i;
    } else if (node.elements[i] === ')') {
      rightIndex = i;
      break;
    }
  }
  if (leftIndex === null && rightIndex === null) {
    return; // no parentheses, nothing to do
  } else if (leftIndex === null || rightIndex === null) {
    node.elements = null; // unbalanced parentheses
    return;
  } else {
    let newNode = {elements: node.elements.slice(leftIndex + 1, rightIndex)}; // new node with contents of parentheses
    node.elements.splice(leftIndex, rightIndex - leftIndex + 1, newNode); // stick it in
    collectParentheses(node); // look for more
  }
};

CGrapher.isValueElement = function (element) {
  return element === 'i' || element === 'z' || element === 'e' || element === 'π' || element === 'pi' || element === 'tau' ||
    typeof element === 'number' || typeof element === 'object';
};

CGrapher.parseFunctions = function parseFunctions(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = 0; i < node.elements.length; i++) {
    if (typeof node.elements[i] === 'object') {
      parseFunctions(node.elements[i]);
    }
    if (CGrapher.namedFunctions.includes(node.elements[i])) {
      if (i === node.elements.length - 1 || !CGrapher.isValueElement(node.elements[i + 1])) {
        node.elements = null;
        return;
      } else if (node.elements.length > 2) {
        let newNode = {elements: node.elements.slice(i, i + 2)};
        node.elements.splice(i, 2, newNode);
      }
    }
  }
}

CGrapher.parseConjugations = function parseConjugations(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = 0; i < node.elements.length; i++) {
    if (typeof node.elements[i] === 'object') {
      parseConjugations(node.elements[i]);
    }
    if (node.elements[i] === '\'') {
      if (i === 0 || !CGrapher.isValueElement(node.elements[i - 1])) {
        node.elements = null;
        return;
      } else {
        let newNode = {elements: node.elements.slice(i - 1, i + 1)};
        node.elements.splice(i - 1, 2, newNode);
        i--;
      }
    }
  }
}

CGrapher.insertMultiplications = function insertMultiplications(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = 0; i < node.elements.length; i++) {
    if (typeof node.elements[i] === 'object') {
      insertMultiplications(node.elements[i]);
    }
    if (i > 0 && CGrapher.isValueElement(node.elements[i]) && CGrapher.isValueElement(node.elements[i - 1])) {
      let newNode = {elements: [node.elements[i - 1], '*', node.elements[i]]};
      node.elements.splice(i - 1, 2, newNode);
      i--;
    }
  }
};

CGrapher.parseExponentiation = function parseExponentiation(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = node.elements.length - 1; i >= 0; i--) {
    if (typeof node.elements[i] === 'object') {
      parseExponentiation(node.elements[i]);
    }
    if (node.elements[i] === '^') {
      if (i === 0 || i === node.elements.length - 1) {
        node.elements = null;
        return;
      }
      if (!CGrapher.isValueElement(node.elements[i - 1])) {
        node.elements = null;
        return;
      }
      if (CGrapher.isValueElement(node.elements[i + 1])) {
        if (node.elements.length > 3) {
          let newNode = {elements: node.elements.slice(i - 1, i + 2)};
          node.elements.splice(i - 1, 3, newNode);
          i--;
        }
      } else if (node.elements[i + 1] === '-' && i < node.elements.length - 2 && CGrapher.isValueElement(node.elements[i + 2])) {
        if (node.elements.length > 4) {
          let newNode = {elements: node.elements.slice(i - 1, i + 3)};
          node.elements.splice(i - 1, 4, newNode);
          i--;
        }
      } else {
        node.elements = null;
        return;
      }
    }
  }
};

CGrapher.parseMultiplicationsAndDivisions = function parseMultiplicationsAndDivisions(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = 0; i < node.elements.length; i++) {
    if (typeof node.elements[i] === 'object') {
      parseMultiplicationsAndDivisions(node.elements[i]);
    }
    if (node.elements[i] === '*' || node.elements[i] === '/') {
      if (i === 0 || i === node.elements.length - 1) {
        node.elements = null;
        return;
      }
      if (!CGrapher.isValueElement(node.elements[i - 1])) {
        node.elements = null;
        return;
      }
      if (CGrapher.isValueElement(node.elements[i + 1])) {
        if (node.elements.length > 3) {
          let newNode = {elements: node.elements.slice(i - 1, i + 2)};
          node.elements.splice(i - 1, 3, newNode);
          i--;
        }
      } else if (node.element[i + 1] === '-' && i < node.elements.length - 2 && CGrapher.isValueElement(node.elements[i + 2])) {
        if (node.elements.length > 4) {
          let newNode = {elements: node.elements.slice(i - 1, i + 3)};
          node.elements.splice(i - 1, 4, newNode);
          i--;
        }
      } else {
        node.elements = null;
        return;
      }
    }
  }
};

CGrapher.parseUnaryNegatives = function parseUnaryNegatives(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = node.elements.length - 1; i >= 0; i--) {
    if (typeof node.elements[i] === 'object') {
      parseUnaryNegatives(node.elements[i]);
    }
    if (node.elements[i] === '-') {
      if (i === node.elements.length - 1) { // can't end on a -
        node.elements = null;
        return;
      }
      if (!CGrapher.isValueElement(node.elements[i + 1])) { // unary - needs a value
        node.elements = null;
        return;
      }
      if (i === 0 || !CGrapher.isValueElement(node.elements[i - 1])) { // previous element is not a value
        if (node.elements.length > 2) {
          let newNode = {elements: node.elements.slice(i, i + 2)};
          node.elements.splice(i, 2, newNode);
        }
      }
    }
  }
};

CGrapher.parseAdditionsAndSubtractions = function parseAdditionsAndSubtractions(node) {
  if (node.elements === null) {
    return;
  }
  for (let i = 0; i < node.elements.length; i++) {
    if (typeof node.elements[i] === 'object') {
      parseAdditionsAndSubtractions(node.elements[i]);
    }
    if (node.elements[i] === '+' || node.elements[i] === '-') {
      if (node.elements.length < 2) {
        node.elements = null;
        return;
      } else if (node.elements.length === 2) { // the only acceptable two-element node is ['-', value]
        if ((i === 0 && node.elements[i] === '+') || i === 1) {
          node.elements = null;
          return;
        }
      } else {
        if (i === 0 || i === node.elements.length - 1) {
          node.elements = null;
          return;
        }
        if (!CGrapher.isValueElement(node.elements[i - 1]) || !CGrapher.isValueElement(node.elements[i + 1])) {
          node.elements = null;
          return;
        }
        if (node.elements.length > 3) {
          let newNode = {elements: node.elements.slice(i - 1, i + 2)};
          node.elements.splice(i - 1, 3, newNode);
          i--;
        }
      }
    }
  }
};

CGrapher.prototype.compileFunction = function compileFunction(node) {
  if (typeof node === 'object') {
    if (node.elements === null) {
      return null;
    }
    if (node.elements.length === 1) {
      return compileFunction(node.elements[0]);
    } else if (node.elements.length === 2) {
      if (node.elements[0] === '-') {
        return function (z) {
          return compileFunction(node.elements[1])(z).negate();
        }
      } else if (node.elements[1] === '\'') {
        return function (z) {
          return compileFunction(node.elements[0])(z).conjugate();
        }
      } else if (node.elements[0] === 'exp') {
        return function (z) {
          return compileFunction(node.elements[1])(z).exp();
        }
      } else if (node.elements[0] === 'sin') {
        return function (z) {
          return compileFunction(node.elements[1])(z).sin();
        }
      } else if (node.elements[0] === 'cos') {
        return function (z) {
          return compileFunction(node.elements[1])(z).cos();
        }
      } else if (node.elements[0] === 'tan') {
        return function (z) {
          return compileFunction(node.elements[1])(z).tan();
        }
      } else if (node.elements[0] === 'csc') {
        return function (z) {
          return compileFunction(node.elements[1])(z).csc();
        }
      } else if (node.elements[0] === 'sec') {
        return function (z) {
          return compileFunction(node.elements[1])(z).sec();
        }
      } else if (node.elements[0] === 'cot') {
        return function (z) {
          return compileFunction(node.elements[1])(z).cot();
        }
      } else if (node.elements[0] === 'ln') {
        return function (z) {
          return compileFunction(node.elements[1])(z).ln(this.zeroCenter);
        }
      } else {
        return null;
      }
    } else if (node.elements.length === 3) {
      let value1 = compileFunction(node.elements[0]);
      let value2 = compileFunction(node.elements[2]);
      if (node.elements[1] === '+') {
        return function (z) {
          return value1(z).add(value2(z));
        }
      } else if (node.elements[1] === '-') {
        return function (z) {
          return value1(z).subtract(value2(z));
        }
      } else if (node.elements[1] === '*') {
        return function (z) {
          return value1(z).multiply(value2(z));
        }
      } else if (node.elements[1] === '/') {
        return function (z) {
          return value1(z).divide(value2(z));
        }
      } else if (node.elements[1] === '^') {
        return function (z) {
          return value1(z).exponentiate(value2(z), this.zeroCenter);
        }
      }
    } else {
      return null;
    }
  } else if (typeof node === 'number') {
    return function (z) {
      return new Complex(node, 0, 0);
    }
  } else if (node === 'z') {
    return function (z) {
      return z;
    }
  } else if (node === 'i') {
    return function (z) {
      return new Complex(0, 1, 0);
    }
  } else if (node === 'e') {
    return function (z) {
      return new Complex(Math.E, 0, 0);
    }
  } else if (node === 'π' || node === 'pi') {
    return function (z) {
      return new Complex(Math.PI, 0, 0);
    }
  } else if (node === 'tau') {
    return function (z) {
      return new Complex(2*Math.PI, 0, 0);
    }
  } else {
    return null;
  }
};

CGrapher.prototype.setupEssentialSingularityPattern = function () {
  const pCanvas = document.createElement('canvas');
  const pCtx = pCanvas.getContext('2d');
  pCanvas.width = this.essentialSingularityPatternWidth;
  pCanvas.height = this.essentialSingularityPatternWidth;

  pCtx.fillStyle = 'rgb(255,255,255)';
  pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

  pCtx.fillStyle = 'rgb(0,0,0)';

  pCtx.beginPath();
  pCtx.moveTo(0,0);
  pCtx.lineTo(0, pCanvas.width/2);
  pCtx.lineTo(pCanvas.height/2, 0);
  pCtx.closePath();
  pCtx.fill();

  pCtx.beginPath();
  pCtx.moveTo(0,pCanvas.height);
  pCtx.lineTo(pCanvas.width, 0);
  pCtx.lineTo(pCanvas.width, pCanvas.height/2);
  pCtx.lineTo(pCanvas.width/2, pCanvas.height);
  pCtx.closePath();
  pCtx.fill();

  this.essentialSingularityPattern = this.ctx.createPattern(pCanvas, 'repeat');
};

CGrapher.prototype.draw = function () {
  this.drawBackground();
  this.drawTitle();
  this.drawControls();
  this.drawMainGraph();
  this.drawAuxiliaryGraph();
};

CGrapher.prototype.drawBackground = function () {
  this.ctx.fillStyle = 'rgb(221,221,221)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

CGrapher.prototype.drawTitle = function () {
  this.ctx.fillStyle = 'rgb(0,0,0)';
  this.ctx.font = '48px serif';
  this.ctx.textAlign = 'left';
  this.ctx.fillText('ℂ-Grapher', 80, 48);
}

CGrapher.prototype.drawControls = function () {
  this.zoomButton.draw();
  this.contoursButton.draw();
};

CGrapher.prototype.drawMainGraph = function () {
  this.drawMainColorGraph();
  this.drawMainAxes();
};

CGrapher.prototype.drawMainColorGraph = function () {
  let colorAtInfinity = this.zToColor(this.formula(new Complex(1, 0, 1)), false, false);

  let w = this.w;
  let h = this.h;
  const imageData = this.ctx.createImageData(w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let i = y*h + x;
      let z = this.xyToZ(x, y);
      let color = this.zToColor(this.formula(z), true, true);
      if (color === null) {
        color = {r: 128, g: 128, b: 128};
      }
      imageData.data[4*i] = color.r;
      imageData.data[4*i + 1] = color.g;
      imageData.data[4*i + 2] = color.b;
      imageData.data[4*i + 3] = 255;
    }
  }
  this.ctx.putImageData(imageData, this.offsetX, this.offsetY);

  if (colorAtInfinity !== null) {
    this.ctx.strokeStyle = 'rgba(' + colorAtInfinity.r + ',' + colorAtInfinity.g + ',' + colorAtInfinity.b + ',1)';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(this.offsetX + 2, this.offsetY + 2, this.w - 4, this.h - 4);
    this.ctx.lineWidth = 8;
    this.ctx.filter = 'blur(5px)';
    this.ctx.strokeRect(this.offsetX + 4, this.offsetY + 4, this.w - 8, this.h - 8);
  } else {
    this.ctx.strokeStyle = this.essentialSingularityPattern;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(this.offsetX + 2, this.offsetY + 2, this.w - 4, this.h - 4);
    this.ctx.lineWidth = 10;
    this.ctx.filter = 'blur(2px)';
    this.ctx.strokeRect(this.offsetX + 5, this.offsetY + 5, this.w - 10, this.h - 10);
  }
  
  this.ctx.filter = 'none';
};

CGrapher.prototype.drawMainAxes = function () {
  this.ctx.lineWidth = 1;
  this.ctx.strokeStyle = 'rgba(128,128,128,0.9)';

  this.ctx.beginPath();
  this.ctx.moveTo(this.offsetX, this.centerY + this.offsetY);
  this.ctx.lineTo(this.w + this.offsetX, this.centerY + this.offsetY);
  this.ctx.moveTo(this.centerX + this.offsetX, this.offsetY);
  this.ctx.lineTo(this.centerX + this.offsetX, this.h + this.offsetY);
  this.ctx.stroke();

  this.ctx.beginPath();
  let scale = CGrapher.zoomScales[this.zoomScalesIndex];
  if (scale > this.unitCircleThickness/2) {
    this.ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, scale - this.unitCircleThickness/2, 0, 2*Math.PI);
  }
  this.ctx.arc(this.centerX + this.offsetX, this.centerY + this.offsetY, scale + this.unitCircleThickness/2, 0, 2*Math.PI);
  this.ctx.stroke();
};

CGrapher.prototype.drawAuxiliaryGraph = function () {
  this.drawAuxiliaryBackground();
  this.drawAuxiliaryAxes();
  this.drawAuxiliaryLineGraph();
};

CGrapher.prototype.drawAuxiliaryBackground = function () {
  this.ctx.fillStyle = 'rgb(192,192,192)';
  this.ctx.fillRect(this.uOffsetX, this.uOffsetY, this.uw, this.uh);
};

CGrapher.prototype.drawAuxiliaryLineGraph = function () {
  this.ctx.lineWidth = 2;

  let lastPoint = null;
  let dx = this.w/(this.un - 1);
  for (let i = 0; i < this.un; i++) {
    let x = i*dx;
    let w = this.xToW(x);
    let z = this.formula(w);
    let color = this.zToColor(z, false, false);
    let y = this.zToY(z);
    if (isNaN(y)) { // don't do anything here, because singularities are, well, singular,
      // and you can't expect that they'll appear due to numerical issues
      lastPoint = null;
    } else if (lastPoint === null) {
      lastPoint = {x: x, y: y, color: color};
    } else {
      let lastY = lastPoint.y;
      let thisY = y;
      if (lastY < 0 && thisY >= 0) { // last value was too high, this value is not too high
        lastY = 0;
        if (thisY > this.uh) { // this value is too low
          thisY = this.uh;
        }
      } else if (lastY > this.uh && thisY <= this.uh) { // last value was too low, this value is not too low
        lastY = this.uh;
        if (thisY < 0) { // this value is too high
          thisY = 0;
        }
      } else if (thisY < 0 && lastY >= 0) { // this one is too high; last is not too high
        thisY = 0;
      } else if (thisY > this.uh && lastY <= this.uh) { // this one is too low; last is not too low
        thisY = this.uh;
      }
      if (!(lastY < 0 && thisY < 0) && !(lastY > this.uh && thisY > this.uh)) {
        let gradient = this.ctx.createLinearGradient(lastPoint.x + this.uOffsetX, lastY + this.uOffsetY, x + this.uOffsetX, thisY + this.uOffsetY);
        gradient.addColorStop(0, 'rgb(' + lastPoint.color.r + ',' + lastPoint.color.g + ',' + lastPoint.color.b + ')');
        gradient.addColorStop(1, 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')');
        this.ctx.strokeStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x + this.uOffsetX, lastY + this.uOffsetY);
        this.ctx.lineTo(x + this.uOffsetX, thisY + this.uOffsetY);
        this.ctx.stroke();
      }
      lastPoint = {x: x, y: y, color: color};
    }
  }
};

CGrapher.prototype.drawAuxiliaryAxes = function () {
  this.ctx.lineWidth = 2;
  this.ctx.strokeStyle = 'rgba(128,128,128,1)';

  this.ctx.beginPath();
  this.ctx.moveTo(this.uOffsetX + this.uCenterX, this.uOffsetY);
  this.ctx.lineTo(this.uOffsetX + this.uCenterX, this.uOffsetY + this.uh);
  this.ctx.stroke();

  this.ctx.beginPath();
  this.ctx.moveTo(this.uOffsetX, this.uCenterY + this.uOffsetY);
  this.ctx.lineTo(this.uOffsetX + this.uw, this.uCenterY + this.uOffsetY);
  this.ctx.stroke();

  this.ctx.lineWidth = 1;

  let hashMarkWidth = (10*Math.LN2/Math.LN10)*this.uh/this.uDbHeight;
  let topMark = Math.floor(this.uCenterY/hashMarkWidth);
  let bottomMark = -Math.floor((this.uh - this.uCenterY)/hashMarkWidth);
  for (let i = bottomMark; i <= topMark; i++) {
    if (i === 0) {
      continue;
    }
    let y = this.uCenterY - i*hashMarkWidth;
    this.ctx.strokeStyle = 'rgba(128,128,128,0.4)';
    if (i % 2 === 0) {
      this.ctx.strokeStyle = 'rgba(128,128,128,1)';
    }
    this.ctx.beginPath();
    this.ctx.moveTo(this.uOffsetX, this.uOffsetY + y);
    this.ctx.lineTo(this.uOffsetX + this.uw, this.uOffsetY + y);
    this.ctx.stroke();
  }

  for (let i = 1; i < 16; i++) {
    if (i === 8) {
      continue;
    }
    this.ctx.strokeStyle = 'rgba(128,128,128,0.4)';
    if (i % 2 === 0) {
      this.ctx.strokeStyle = 'rgba(128,128,128,1)';
    }
    this.ctx.beginPath();
    this.ctx.moveTo(this.uOffsetX + i*this.uw/16, this.uOffsetY);
    this.ctx.lineTo(this.uOffsetX + i*this.uw/16, this.uOffsetY + this.uh);
    this.ctx.stroke();
  }
};

CGrapher.prototype.xyToZ = function (x, y) { // in image coordinates, not canvas coordinates
  let scale = CGrapher.zoomScales[this.zoomScalesIndex];
  return new Complex((x - this.centerX)/scale, (this.centerY - y)/scale, 0);
};

CGrapher.prototype.xToW = function (x) { // auxiliary graph for the unit circle, in image coordinates
  let w = x*2*Math.PI/this.uw;
  return new Complex(Math.cos(w), Math.sin(w), 0);
};

CGrapher.prototype.zToY = function (z) { // in image coordinates; can return out of bounds values
  let m = z.magnitude();
  if (isNaN(m)) {
    return NaN;
  } else if (m === Infinity) {
    return 0;
  } else if (m === 0) {
    return this.uh;
  } else {
    let db = 10*Math.log(m)/Math.LN10;
    let dy = db*this.uh/this.uDbHeight;
    return this.uCenterY - dy;
  }
};

CGrapher.prototype.zToColor = function (z, drawMagnitudeContours, drawAngleContours) {
  // we use a false argument to determine colors outside of the context of the graph itself
  drawMagnitudeContours = drawMagnitudeContours && this.drawMagnitudeContours;
  drawAngleContours = drawAngleContours && this.drawAngleContours;
  if (z.inf > 0) {
    return {r: 255, g: 255, b: 255};
  } else if (z.inf < 0) {
    return {r: 0, g: 0, b: 0};
  } else if (isNaN(z.inf)) {
    return null;
  } else {
    let l = (2/Math.PI)*Math.atan(z.magnitude());
    let h = z.angle()/(Math.PI/3);
    let s = 1;

    let f = 1; // fraction by which to darken everything
    if (drawMagnitudeContours || drawAngleContours) {
      // graph contours in the r direction
      let db = 10*Math.log(z.magnitude())/Math.log(10); // maybe this should be 3db
      let frac = db - Math.floor(db);
      if (drawMagnitudeContours) {
        if (frac > 0.06 && frac < 0.94) {
          s = 0.8 + 0.2*(0.5 - Math.abs(l - 0.5));
          if (db > -1 && db < 1) {
            s = 0.45 + 0.45*Math.abs(db);
          }
        } else if (!drawAngleContours) {
          l = 0.5 + (l - 0.5)*0.8;
        }
      }

      // hue-based scaling factor to make graph contours in the theta direction
      //f = 1/(1.2 - 0.2*Math.cos(4*Math.PI*h));
      let hr = h*4 - Math.floor(h*4);
      if (drawAngleContours) {
        if (hr <= 0.06 || hr >= 0.94) {
          s = 1;
          if (!drawMagnitudeContours) {
            l = 0.5 + (l - 0.5)*0.8;
          }
        } else if (!drawMagnitudeContours) {
          s = 0.8 + 0.2*(0.5 - Math.abs(l - 0.5));
          //f = 1 - 0.5*Math.abs(hr - 0.5);
        }
      }

      if (drawMagnitudeContours && drawAngleContours) {
        if ((frac <= 0.06 || frac >= 0.94) && (hr <= 0.06 || hr >= 0.94)) {
          l = 0.5 + (l - 0.5)*0.6;
        } else if (frac <= 0.06 || frac >= 0.94 || hr <= 0.06 || hr >= 0.94) {
          l = 0.5 + (l - 0.5)*0.8;
        }
      }
    }
    // modified formula for hsl to rgb
    let c = (1 - Math.abs(2*l - 1))*s;
    let m = l - c/2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h <= 1) {
      r = c;
      g = c*h;
    } else if (h <= 2) {
      r = c*(2 - h);
      g = c;
    } else if (h <= 3) {
      g = c;
      b = c*(h - 2);
    } else if (h <= 4) {
      g = c*(4 - h);
      b = c;
    } else if (h <= 5) {
      r = c*(h - 4);
      b = c;
    } else if (h <= 6) {
      r = c;
      b = c*(6 - h);
    }

    r *= f;
    g *= f;
    b *= f;

    return {r: Math.floor(256*(r + m)), g: Math.floor(256*(g + m)), b: Math.floor(256*(b + m))};
  }
};

// standard formula for hsl to rgb
CGrapher.prototype.hslToRgb = function (h, s, l) {
  let c = (1 - Math.abs(2*l - 1))*s;
  let m = l - c/2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h <= 1) {
    r = c;
    g = c*h;
  } else if (h <= 2) {
    r = c*(2 - h);
    g = c;
  } else if (h <= 3) {
    g = c;
    b = c*(h - 2);
  } else if (h <= 4) {
    g = c*(4 - h);
    b = c;
  } else if (h <= 5) {
    r = c*(h - 4);
    b = c;
  } else if (h <= 6) {
    r = c;
    b = c*(6 - h);
  }
  return {r: r + m, g: g + m, b: b + m};
};

CGrapher.prototype.setupButtonImages = function () {
  let width = 32;
  let height = 32;
  const activePie = this.ctx.createImageData(width, height);
  const inactivePie = this.ctx.createImageData(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let i = y*height + x;
      let h = (3/Math.PI)*Math.atan2(height/2 - y, x - width/2);
      if (h < 0) {
        h += 6;
      }
      let sActive = 1;
      let sInactive = 0.5;
      let l = 1/2;
      let rgbActive = this.hslToRgb(h, sActive, l);
      let rgbInactive = this.hslToRgb(h, sInactive, l);
      let [rActive, gActive, bActive] = [rgbActive.r, rgbActive.g, rgbActive.b];
      let [rInactive, gInactive, bInactive] = [rgbInactive.r, rgbInactive.g, rgbInactive.b];
      let a = (16 - Math.sqrt((height/2 - y)*(height/2 - y) + (x - width/2)*(x - width/2)))/16;
      if (a < 0) {
        a = 0;
      }
      activePie.data[4*i] = Math.floor(255*rActive);
      activePie.data[4*i + 1] = Math.floor(255*gActive);
      activePie.data[4*i + 2] = Math.floor(255*bActive);
      activePie.data[4*i + 3] = Math.floor(255*a);
      inactivePie.data[4*i] = Math.floor(255*rInactive);
      inactivePie.data[4*i + 1] = Math.floor(255*gInactive);
      inactivePie.data[4*i + 2] = Math.floor(255*bInactive);
      inactivePie.data[4*i + 3] = Math.floor(255*a);
    }
  }
  this.activePieCanvas = document.createElement('canvas');
  this.activePieCanvas.width = 32;
  this.activePieCanvas.height = 32;
  activeCtx = this.activePieCanvas.getContext('2d');
  activeCtx.putImageData(activePie, 0, 0);

  this.inactivePieCanvas = document.createElement('canvas');
  this.inactivePieCanvas.width = 32;
  this.inactivePieCanvas.height = 32;
  inactiveCtx = this.inactivePieCanvas.getContext('2d');
  inactiveCtx.putImageData(inactivePie, 0, 0);
};

function EqualSectionedButton(x, y, w, h, r, n, cGrapher) {
  this.base = CanvasSectionedRoundedRectButton;
  let dividers = [];
  for (let i = 1; i < n; i++) {
    dividers.push(x + i*w/n);
  }
  let ctx = null;
  if (cGrapher) {
    ctx = cGrapher.ctx;
  }
  this.base(x, y, w, h, r, dividers, ctx);
  this.cGrapher = cGrapher;
  this.fillStyle = 'rgb(192,192,192)';
  this.selectedFillStyle = 'rgb(255,255,255)';
}
EqualSectionedButton.prototype = new CanvasSectionedRoundedRectButton;

function ZoomButton(x, y, w, h, r, n, cGrapher) {
  this.base = EqualSectionedButton;
  this.base(x, y, w, h, r, n, cGrapher);
}
ZoomButton.prototype = new EqualSectionedButton;

ZoomButton.prototype.onMouseUp = function (x, y) {
  this.cGrapher.changeZoom(this.getSection(x, y));
};

ZoomButton.prototype.draw = function () {
  EqualSectionedButton.prototype.draw.call(this);
  let circleRadii = [1, 3, 5, 10, 14];
  for (let i = 0; i <= this.dividers.length; i++) {
    if (i === this.selected) {
      this.ctx.strokeStyle = 'rgb(0,0,0)';
    } else {
      this.ctx.strokeStyle = 'rgb(128,128,128)';
    }
    this.ctx.lineWidth = 1;

    let left, right;
    let top = this.y;
    let bottom = this.y + this.h;
    if (i === 0) {
      left = this.x;
    } else {
      left = this.dividers[i - 1];
    }
    if (i === this.dividers.length) {
      right = this.x + this.w;
    } else {
      right = this.dividers[i];
    }
    let centerX = (left + right)/2;
    let centerY = (top + bottom)/2;

    if (i === this.selected) {
      this.ctx.drawImage(this.cGrapher.activePieCanvas, centerX - 16, centerY - 16);
    } else {
      this.ctx.drawImage(this.cGrapher.inactivePieCanvas, centerX - 16, centerY - 16);
    }

    let axisRadius = 16;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - axisRadius);
    this.ctx.lineTo(centerX, centerY + axisRadius);
    this.ctx.moveTo(centerX - axisRadius, centerY);
    this.ctx.lineTo(centerX + axisRadius, centerY);
    this.ctx.stroke();

    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, circleRadii[i], 0, 2*Math.PI, false);
    this.ctx.stroke();
  }
};

function ContoursButton(x, y, w, h, r, n, cGrapher) {
  this.base = EqualSectionedButton;
  this.base(x, y, w, h, r, n, cGrapher);
}
ContoursButton.prototype = new EqualSectionedButton;

ContoursButton.prototype.onMouseUp = function (x, y) {
  let section = this.getSection(x, y);
  if (section === 0) {
    this.cGrapher.changeContours(false, false);
  } else if (section === 1) {
    this.cGrapher.changeContours(true, false);
  } else if (section === 2) {
    this.cGrapher.changeContours(false, true);
  } else {
    this.cGrapher.changeContours(true, true);
  }
};

ContoursButton.prototype.draw = function () {
  EqualSectionedButton.prototype.draw.call(this);
  for (let i = 0; i <= this.dividers.length; i++) {
    if (i === this.selected) {
      this.ctx.strokeStyle = 'rgb(0,0,0)';
    } else {
      this.ctx.strokeStyle = 'rgb(128,128,128)';
    }
    this.ctx.lineWidth = 1;

    let left, right;
    let top = this.y;
    let bottom = this.y + this.h;
    if (i === 0) {
      left = this.x;
    } else {
      left = this.dividers[i - 1];
    }
    if (i === this.dividers.length) {
      right = this.x + this.w;
    } else {
      right = this.dividers[i];
    }
    let centerX = (left + right)/2;
    let centerY = (top + bottom)/2;

    if (i === this.selected) {
      this.ctx.drawImage(this.cGrapher.activePieCanvas, centerX - 16, centerY - 16);
    } else {
      this.ctx.drawImage(this.cGrapher.inactivePieCanvas, centerX - 16, centerY - 16);
    }

    if (i === 1 || i === 3) { // |z| contours
      let radii = [2, 5, 8, 11, 14];
      for (let j = 0; j < radii.length; j++) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radii[j], 0, 2*Math.PI, true);
        this.ctx.stroke();
      }
    }

    if (i === 2 || i === 3) { // <z contours
      let axisRadius = 16;
      let nAxes = 6;
      for (let j = 0; j < nAxes; j++) {
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + axisRadius*Math.cos(j*Math.PI/nAxes), centerY + axisRadius*Math.sin(j*Math.PI/nAxes));
        this.ctx.lineTo(centerX - axisRadius*Math.cos(j*Math.PI/nAxes), centerY - axisRadius*Math.sin(j*Math.PI/nAxes));
        this.ctx.stroke();
      }
    }
  }
};