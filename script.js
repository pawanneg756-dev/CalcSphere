class CalQuora{bindCurrencyConverter(){const c=document.getElementById('currency-convert-btn');if(!c)return;c.addEventListener('click',async()=>{const a=parseFloat(document.getElementById('currency-amount').value),f=document.getElementById('currency-from').value,t=document.getElementById('currency-to').value,r=document.getElementById('currency-result');if(!a||!f||!t){r.textContent='Please fill in all fields.';return}r.textContent='Fetching latest rates...';try{const e=await fetch(`https://open.er-api.com/v6/latest/${f}`),d=await e.json();if(d.result==='success'&&d.rates[t]){const s=d.rates[t],v=a*s;r.textContent=`${a} ${f} = ${v.toFixed(2)} ${t}`}else r.textContent='Conversion failed. Try again.'}catch{r.textContent='Error fetching rates.'}})}constructor(){this.currentValue='0';this.previousValue=null;this.operator=null;this.waitingForOperand=false;this.currentBase='dec';this.history=JSON.parse(localStorage.getItem('calcHistory'))||[];this.currentTheme=localStorage.getItem('calcTheme')||'light';this.initializeElements();this.bindEvents();this.bindCurrencyConverter();this.loadTheme();this.updateDisplay();this.updateHistory()}initializeElements(){this.display=document.getElementById('display');this.expression=document.getElementById('expression');this.calcPanels=document.querySelectorAll('.calc-panel');this.calcTypeBtns=document.querySelectorAll('.calc-type-btn');this.historyList=document.getElementById('historyList');this.themeToggle=document.getElementById('themeToggle');this.navBtns=document.querySelectorAll('.nav-btn');this.pages=document.querySelectorAll('.page');this.financeTabs=document.querySelectorAll('.finance-tab');this.financeTabContents=document.querySelectorAll('.finance-tab-content');this.toolsTabs=document.querySelectorAll('.tools-tab');this.toolsTabContents=document.querySelectorAll('.tools-tab-content');this.baseBtns=document.querySelectorAll('.base-btn');this.stopwatchInterval=null;this.stopwatchTime=0;this.stopwatchRunning=false;this.switching=false}bindEvents(){this.calcTypeBtns.forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const t=e.target.closest('.calc-type-btn').dataset.type;if(t)this.switchCalculatorType(t)})})

        // Button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn')) {
                this.handleButtonClick(e.target);
            }
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Navigation
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.closest('.nav-btn').dataset.page;
                if (page) {
                    this.switchPage(page);
                    if (page === 'home') {
                        this.switchCalculatorType('basic');
                    }
                }
            });
        });

        // Finance tabs
        this.financeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFinanceTab(e.target.dataset.tab));
        });

        // Tools tabs
        this.toolsTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.toolsTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.toolsTabContents.forEach(c => c.classList.remove('active'));
                const targetTab = document.getElementById(tabName + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });

            // Close 'Made with love' bar (not persistent)
            const loveBar = document.querySelector('.bottom-bar');
            const closeBtn = document.getElementById('closeLoveBar');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (loveBar) loveBar.style.display = 'none';
                });
            }

        // Number base switching
        this.baseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchNumberBase(e.target.dataset.base));
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // History clear
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-clear-history')) {
                this.clearHistory();
            }
        });
    }

    switchCalculatorType(type) {
        // Prevent multiple rapid clicks
        if (this.switching) return;
        this.switching = true;

        try {
            // Update active button
            this.calcTypeBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.style.pointerEvents = 'none';
            });
            
            const activeBtn = document.querySelector(`[data-type="${type}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }

            // Update active panel
            this.calcPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            const activePanel = document.getElementById(`${type}-calc`);
            if (activePanel) {
                activePanel.classList.add('active');
            }

            // Reset calculator state only for calculator types, not tools
            if (type !== 'tools') {
                this.reset();
            }

            // Re-enable buttons after a short delay
            setTimeout(() => {
                this.calcTypeBtns.forEach(btn => {
                    btn.style.pointerEvents = 'auto';
                });
                this.switching = false;
            }, 300);

        } catch (error) {
            console.error('Error switching calculator type:', error);
            this.switching = false;
        }
    }

    switchFinanceTab(tab) {
        this.financeTabs.forEach(t => t.classList.remove('active'));
        this.financeTabContents.forEach(c => c.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    switchToolsTab(tab) {
        this.toolsTabs.forEach(t => t.classList.remove('active'));
        this.toolsTabContents.forEach(c => c.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    switchNumberBase(base) {
        this.baseBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-base="${base}"]`).classList.add('active');
        
        this.currentBase = base;
        this.convertDisplayToBase();
    }

    handleButtonClick(button) {
        const action = button.dataset.action;
        const number = button.dataset.number;

        // Add visual feedback
        button.classList.add('bounce');
        setTimeout(() => button.classList.remove('bounce'), 500);

        // Check if we're in tools or finance calculator mode
        const currentPanel = document.querySelector('.calc-panel.active');
        if (currentPanel && (currentPanel.id === 'tools-calc' || currentPanel.id === 'finance-calc')) {
            // For tools/finance calculator, only handle action buttons, not number inputs
            if (action) {
                this.handleAction(action);
            }
            return;
        }

        if (number !== undefined) {
            this.inputNumber(number);
        } else if (action) {
            this.handleAction(action);
        }
    }

    handleKeyboard(e) {
        // Check if we're in tools or finance calculator mode
        const currentPanel = document.querySelector('.calc-panel.active');
        if (currentPanel && (currentPanel.id === 'tools-calc' || currentPanel.id === 'finance-calc')) {
            // Don't prevent default for tools/finance calculator - let normal input work
            return;
        }

        e.preventDefault();

        const key = e.key;
        const button = document.querySelector(`[data-number="${key}"]`) ||
                      document.querySelector(`[data-action="${this.getActionFromKey(key)}"]`);

        if (button) {
            button.click();
        }
    }

    getActionFromKey(key) {
        const keyMap = {
            'Enter': 'equals',
            '=': 'equals',
            'Escape': 'clear',
            'Backspace': 'backspace',
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide',
            '.': '.',
            'c': 'clear',
            'C': 'clear'
        };
        return keyMap[key];
    }

    inputNumber(num) {
        if (this.waitingForOperand) {
            this.currentValue = num;
            this.waitingForOperand = false;
        } else {
            this.currentValue = this.currentValue === '0' ? num : this.currentValue + num;
        }
        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                this.setOperator(action);
                break;
            case 'equals':
                this.calculate();
                break;
            case 'negate':
                this.negate();
                break;
            // Scientific functions
            case 'sin':
                this.scientificFunction('sin');
                break;
            case 'cos':
                this.scientificFunction('cos');
                break;
            case 'tan':
                this.scientificFunction('tan');
                break;
            case 'asin':
                this.scientificFunction('asin');
                break;
            case 'acos':
                this.scientificFunction('acos');
                break;
            case 'atan':
                this.scientificFunction('atan');
                break;
            case 'log':
                this.scientificFunction('log');
                break;
            case 'ln':
                this.scientificFunction('ln');
                break;
            case 'sqrt':
                this.scientificFunction('sqrt');
                break;
            case 'pow':
                this.setOperator('pow');
                break;
            case 'factorial':
                this.scientificFunction('factorial');
                break;
            case 'pi':
                this.inputNumber(Math.PI.toString());
                break;
            case 'exp':
                this.scientificFunction('exp');
                break;
            case 'abs':
                this.scientificFunction('abs');
                break;
            case 'open-paren':
                this.inputNumber('(');
                break;
            case 'close-paren':
                this.inputNumber(')');
                break;
            // Programmer functions
            case 'and':
                this.setOperator('and');
                break;
            case 'or':
                this.setOperator('or');
                break;
            case 'xor':
                this.setOperator('xor');
                break;
            case 'not':
                this.scientificFunction('not');
                break;
            case 'lshift':
                this.setOperator('lshift');
                break;
            case 'rshift':
                this.setOperator('rshift');
                break;
            case 'mod':
                this.setOperator('mod');
                break;
            // Finance calculations
            case 'calculate-loan':
                this.calculateLoan();
                break;
            case 'calculate-investment':
                this.calculateInvestment();
                break;
            case 'calculate-compound':
                this.calculateCompound();
                break;
            // Tools calculations
            case 'calculate-rectangle':
                this.calculateRectangle();
                break;
            case 'calculate-circle':
                this.calculateCircle();
                break;
            case 'calculate-triangle':
                this.calculateTriangle();
                break;
            case 'calculate-cube':
                this.calculateCube();
                break;
            case 'calculate-sphere':
                this.calculateSphere();
                break;
            case 'calculate-bmi':
                this.calculateBMI();
                break;
            case 'calculate-bodyfat':
                this.calculateBodyFat();
                break;
            case 'calculate-calories':
                this.calculateCalories();
                break;
            case 'convert-length':
                this.convertLength();
                break;
            case 'convert-weight':
                this.convertWeight();
                break;
            case 'convert-temperature':
                this.convertTemperature();
                break;
            case 'calculate-time':
                this.calculateTime();
                break;
            case 'calculate-age':
                this.calculateAge();
                break;
            case 'start-stopwatch':
                this.startStopwatch();
                break;
            case 'pause-stopwatch':
                this.pauseStopwatch();
                break;
            case 'reset-stopwatch':
                this.resetStopwatch();
                break;
            // Advanced functions
            case 'integrate':
                this.advancedFunction('integrate');
                break;
            case 'derivative':
                this.advancedFunction('derivative');
                break;
            case 'limit':
                this.advancedFunction('limit');
                break;
            case 'sum':
                this.advancedFunction('sum');
                break;
        }
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.updateDisplay();
    }

    clearEntry() {
        this.currentValue = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    setOperator(op) {
        if (this.operator && !this.waitingForOperand) {
            this.calculate();
        }
        
        this.previousValue = this.currentValue;
        this.operator = op;
        this.waitingForOperand = true;
        this.updateExpression();
    }

    calculate() {
        if (this.operator && this.previousValue !== null) {
            const prev = parseFloat(this.previousValue);
            const current = parseFloat(this.currentValue);
            let result;

            try {
                switch (this.operator) {
                    case 'add':
                        result = prev + current;
                        break;
                    case 'subtract':
                        result = prev - current;
                        break;
                    case 'multiply':
                        result = prev * current;
                        break;
                    case 'divide':
                        if (current === 0) throw new Error('Division by zero');
                        result = prev / current;
                        break;
                    case 'pow':
                        result = Math.pow(prev, current);
                        break;
                    case 'mod':
                        result = prev % current;
                        break;
                    case 'and':
                        result = Math.floor(prev) & Math.floor(current);
                        break;
                    case 'or':
                        result = Math.floor(prev) | Math.floor(current);
                        break;
                    case 'xor':
                        result = Math.floor(prev) ^ Math.floor(current);
                        break;
                    case 'lshift':
                        result = Math.floor(prev) << Math.floor(current);
                        break;
                    case 'rshift':
                        result = Math.floor(prev) >> Math.floor(current);
                        break;
                }

                // Add to history
                this.addToHistory(`${this.previousValue} ${this.getOperatorSymbol(this.operator)} ${this.currentValue}`, result);
                
                this.currentValue = this.formatResult(result);
                this.operator = null;
                this.previousValue = null;
                this.waitingForOperand = true;
                this.updateDisplay();
                this.updateExpression();
            } catch (error) {
                this.showError(error.message);
            }
        }
    }

    scientificFunction(func) {
        const value = parseFloat(this.currentValue);
        let result;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(value * Math.PI / 180);
                    break;
                case 'cos':
                    result = Math.cos(value * Math.PI / 180);
                    break;
                case 'tan':
                    result = Math.tan(value * Math.PI / 180);
                    break;
                case 'asin':
                    result = Math.asin(value) * 180 / Math.PI;
                    break;
                case 'acos':
                    result = Math.acos(value) * 180 / Math.PI;
                    break;
                case 'atan':
                    result = Math.atan(value) * 180 / Math.PI;
                    break;
                case 'log':
                    if (value <= 0) throw new Error('Logarithm of non-positive number');
                    result = Math.log10(value);
                    break;
                case 'ln':
                    if (value <= 0) throw new Error('Logarithm of non-positive number');
                    result = Math.log(value);
                    break;
                case 'sqrt':
                    if (value < 0) throw new Error('Square root of negative number');
                    result = Math.sqrt(value);
                    break;
                case 'factorial':
                    if (value < 0 || value !== Math.floor(value)) throw new Error('Factorial of non-negative integer');
                    result = this.factorial(value);
                    break;
                case 'exp':
                    result = Math.exp(value);
                    break;
                case 'abs':
                    result = Math.abs(value);
                    break;
                case 'not':
                    result = ~Math.floor(value);
                    break;
            }

            this.addToHistory(`${func}(${this.currentValue})`, result);
            this.currentValue = this.formatResult(result);
            this.updateDisplay();
        } catch (error) {
            this.showError(error.message);
        }
    }

    advancedFunction(func) {
        // Placeholder for advanced mathematical functions
        this.showError(`${func} function not implemented yet`);
    }

    negate() {
        if (this.currentValue !== '0') {
            this.currentValue = this.currentValue.startsWith('-') 
                ? this.currentValue.slice(1) 
                : '-' + this.currentValue;
            this.updateDisplay();
        }
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    calculateLoan() {
        const principal = parseFloat(document.getElementById('principal').value);
        const rate = parseFloat(document.getElementById('interest-rate').value);
        const term = parseFloat(document.getElementById('loan-term').value);
        const currency = document.getElementById('loan-currency').value;
        const usdToInr = 83;

        if (!principal || !rate || !term) {
            this.showError('Please fill in all fields');
            return;
        }

        const monthlyRate = rate / 100 / 12;
        const numPayments = term * 12;
        const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                              (Math.pow(1 + monthlyRate, numPayments) - 1);
        const totalPayment = monthlyPayment * numPayments;
        const totalInterest = totalPayment - principal;

        let result = '';
        if (currency === 'USD') {
            result = `Monthly Payment: $${monthlyPayment.toFixed(2)} / ₹${(monthlyPayment * usdToInr).toFixed(2)}\nTotal Payment: $${totalPayment.toFixed(2)} / ₹${(totalPayment * usdToInr).toFixed(2)}\nTotal Interest: $${totalInterest.toFixed(2)} / ₹${(totalInterest * usdToInr).toFixed(2)}`;
        } else {
            result = `Monthly Payment: ₹${(monthlyPayment * usdToInr).toFixed(2)} / $${monthlyPayment.toFixed(2)}\nTotal Payment: ₹${(totalPayment * usdToInr).toFixed(2)} / $${totalPayment.toFixed(2)}\nTotal Interest: ₹${(totalInterest * usdToInr).toFixed(2)} / $${totalInterest.toFixed(2)}`;
        }

        document.getElementById('loan-result').textContent = result;
    }

    calculateInvestment() {
        const initial = parseFloat(document.getElementById('initial-investment').value);
        const monthly = parseFloat(document.getElementById('monthly-contribution').value);
        const rate = parseFloat(document.getElementById('expected-return').value);
        const years = parseFloat(document.getElementById('investment-period').value);
        const currency = document.getElementById('investment-currency').value;
        const usdToInr = 83;

        if (!initial || !monthly || !rate || !years) {
            this.showError('Please fill in all fields');
            return;
        }

        const monthlyRate = rate / 100 / 12;
        const numMonths = years * 12;
        // Future value of initial investment
        const futureValueInitial = initial * Math.pow(1 + monthlyRate, numMonths);
        // Future value of monthly contributions
        const futureValueMonthly = monthly * ((Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate);
        const totalValue = futureValueInitial + futureValueMonthly;
        const totalContributions = initial + (monthly * numMonths);
        const totalGains = totalValue - totalContributions;

        let result = '';
        if (currency === 'USD') {
            result = `Future Value: $${totalValue.toFixed(2)} / ₹${(totalValue * usdToInr).toFixed(2)}\nTotal Contributions: $${totalContributions.toFixed(2)} / ₹${(totalContributions * usdToInr).toFixed(2)}\nTotal Gains: $${totalGains.toFixed(2)} / ₹${(totalGains * usdToInr).toFixed(2)}`;
        } else {
            result = `Future Value: ₹${(totalValue * usdToInr).toFixed(2)} / $${totalValue.toFixed(2)}\nTotal Contributions: ₹${(totalContributions * usdToInr).toFixed(2)} / $${totalContributions.toFixed(2)}\nTotal Gains: ₹${(totalGains * usdToInr).toFixed(2)} / $${totalGains.toFixed(2)}`;
        }

        document.getElementById('investment-result').textContent = result;
    }

    calculateCompound() {
        const principal = parseFloat(document.getElementById('compound-principal').value);
        const rate = parseFloat(document.getElementById('compound-rate').value);
        const time = parseFloat(document.getElementById('compound-time').value);
        const frequency = parseInt(document.getElementById('compound-frequency').value);
        const currency = document.getElementById('compound-currency').value;
        const usdToInr = 83;

        if (!principal || !rate || !time) {
            this.showError('Please fill in all fields');
            return;
        }

        const amount = principal * Math.pow(1 + (rate / 100) / frequency, frequency * time);
        const interest = amount - principal;

        let result = '';
        if (currency === 'USD') {
            result = `Final Amount: $${amount.toFixed(2)} / ₹${(amount * usdToInr).toFixed(2)}\nInterest Earned: $${interest.toFixed(2)} / ₹${(interest * usdToInr).toFixed(2)}\nPrincipal: $${principal.toFixed(2)} / ₹${(principal * usdToInr).toFixed(2)}`;
        } else {
            result = `Final Amount: ₹${(amount * usdToInr).toFixed(2)} / $${amount.toFixed(2)}\nInterest Earned: ₹${(interest * usdToInr).toFixed(2)} / $${interest.toFixed(2)}\nPrincipal: ₹${(principal * usdToInr).toFixed(2)} / $${principal.toFixed(2)}`;
        }

        document.getElementById('compound-result').textContent = result;
    }

    convertDisplayToBase() {
        const value = parseInt(this.currentValue, 10);
        if (isNaN(value)) return;

        switch (this.currentBase) {
            case 'hex':
                this.currentValue = value.toString(16).toUpperCase();
                break;
            case 'bin':
                this.currentValue = value.toString(2);
                break;
            case 'oct':
                this.currentValue = value.toString(8);
                break;
            case 'dec':
            default:
                this.currentValue = value.toString();
                break;
        }
        this.updateDisplay();
    }

    addToHistory(expression, result) {
        const historyItem = {
            id: Date.now(),
            expression,
            result: this.formatResult(result),
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        localStorage.setItem('calcHistory', JSON.stringify(this.history));
        this.updateHistory();
    }

    updateHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-calculator"></i>
                    <p>No calculations yet</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-result="${item.result}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
            </div>
        `).join('');

        // Add click handlers to history items
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentValue = item.dataset.result;
                this.updateDisplay();
            });
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calcHistory');
        this.updateHistory();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('calcTheme', this.currentTheme);
        
        const icon = this.themeToggle.querySelector('i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    switchPage(page) {
        // Update active navigation button
        this.navBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update active page
        this.pages.forEach(pageEl => pageEl.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
    }

    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const icon = this.themeToggle.querySelector('i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    updateDisplay() {
        const currentPanel = document.querySelector('.calc-panel.active');
        const programmerDisplay = document.getElementById('programmer-display');
        const advancedDisplay = document.getElementById('advanced-display');
        if (currentPanel && currentPanel.id === 'programmer-calc' && programmerDisplay) {
            programmerDisplay.textContent = this.currentValue;
        } else if (currentPanel && currentPanel.id === 'advanced-calc' && advancedDisplay) {
            advancedDisplay.textContent = this.currentValue;
        } else if (this.display) {
            this.display.textContent = this.currentValue;
        }
    }

    updateExpression() {
        const currentPanel = document.querySelector('.calc-panel.active');
        const programmerExpression = document.getElementById('programmer-expression');
        const advancedExpression = document.getElementById('advanced-expression');
        const exprText = (this.previousValue && this.operator) ? `${this.previousValue} ${this.getOperatorSymbol(this.operator)}` : '';
        if (currentPanel && currentPanel.id === 'programmer-calc' && programmerExpression) {
            programmerExpression.textContent = exprText;
        } else if (currentPanel && currentPanel.id === 'advanced-calc' && advancedExpression) {
            advancedExpression.textContent = exprText;
        } else if (this.expression) {
            this.expression.textContent = exprText;
        }
    }

    getOperatorSymbol(op) {
        const symbols = {
            'add': '+',
            'subtract': '-',
            'multiply': '×',
            'divide': '÷',
            'pow': '^',
            'mod': 'mod',
            'and': 'AND',
            'or': 'OR',
            'xor': 'XOR',
            'lshift': '<<',
            'rshift': '>>'
        };
        return symbols[op] || op;
    }

    formatResult(result) {
        if (isNaN(result) || !isFinite(result)) {
            return 'Error';
        }
        
        // Format very large or very small numbers
        if (Math.abs(result) >= 1e15 || (Math.abs(result) < 1e-10 && result !== 0)) {
            return result.toExponential(6);
        }
        
        // Format decimal numbers
        if (result % 1 !== 0) {
            return parseFloat(result.toFixed(10)).toString();
        }
        
        return result.toString();
    }

    showError(message) {
        this.display.textContent = 'Error';
        this.display.classList.add('error');
        
        // Show error in expression area
        this.expression.textContent = message;
        this.expression.classList.add('error');
        
        setTimeout(() => {
            this.display.classList.remove('error');
            this.expression.classList.remove('error');
            this.clear();
        }, 3000);
    }

    reset() {
        this.clear();
        this.updateExpression();
    }

    // Tools Calculator Methods
    calculateRectangle() {
        const length = parseFloat(document.getElementById('rect-length').value);
        const width = parseFloat(document.getElementById('rect-width').value);

        if (!length || !width) {
            this.showError('Please enter both length and width');
            return;
        }

        const area = length * width;
        const perimeter = 2 * (length + width);

        const result = `Area: ${area.toFixed(2)} cm²
Perimeter: ${perimeter.toFixed(2)} cm`;

        document.getElementById('rect-result').textContent = result;
    }

    calculateCircle() {
        const radius = parseFloat(document.getElementById('circle-radius').value);

        if (!radius) {
            this.showError('Please enter the radius');
            return;
        }

        const area = Math.PI * radius * radius;
        const circumference = 2 * Math.PI * radius;

        const result = `Area: ${area.toFixed(2)} cm²
Circumference: ${circumference.toFixed(2)} cm`;

        document.getElementById('circle-result').textContent = result;
    }

    calculateTriangle() {
        const base = parseFloat(document.getElementById('tri-base').value);
        const height = parseFloat(document.getElementById('tri-height').value);

        if (!base || !height) {
            this.showError('Please enter both base and height');
            return;
        }

        const area = 0.5 * base * height;

        const result = `Area: ${area.toFixed(2)} cm²`;

        document.getElementById('tri-result').textContent = result;
    }

    calculateCube() {
        const side = parseFloat(document.getElementById('cube-side').value);

        if (!side) {
            this.showError('Please enter the side length');
            return;
        }

        const volume = side * side * side;
        const surfaceArea = 6 * side * side;

        const result = `Volume: ${volume.toFixed(2)} cm³
Surface Area: ${surfaceArea.toFixed(2)} cm²`;

        document.getElementById('cube-result').textContent = result;
    }

    calculateSphere() {
        const radius = parseFloat(document.getElementById('sphere-radius').value);

        if (!radius) {
            this.showError('Please enter the radius');
            return;
        }

        const volume = (4/3) * Math.PI * radius * radius * radius;
        const surfaceArea = 4 * Math.PI * radius * radius;

        const result = `Volume: ${volume.toFixed(2)} cm³
Surface Area: ${surfaceArea.toFixed(2)} cm²`;

        document.getElementById('sphere-result').textContent = result;
    }

    calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight').value);
        const height = parseFloat(document.getElementById('bmi-height').value);

        if (!weight || !height) {
            this.showError('Please enter both weight and height');
            return;
        }

        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        
        let category = '';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';

        const result = `BMI: ${bmi.toFixed(1)}
Category: ${category}`;

        document.getElementById('bmi-result').textContent = result;
    }

    calculateBodyFat() {
        const weight = parseFloat(document.getElementById('bf-weight').value);
        const height = parseFloat(document.getElementById('bf-height').value);
        const age = parseFloat(document.getElementById('bf-age').value);
        const gender = document.getElementById('bf-gender').value;

        if (!weight || !height || !age) {
            this.showError('Please fill in all fields');
            return;
        }

        // Using Deurenberg formula
        const bmi = weight / Math.pow(height / 100, 2);
        let bodyFat = (1.20 * bmi) + (0.23 * age) - 16.2;
        
        if (gender === 'female') {
            bodyFat = (1.20 * bmi) + (0.23 * age) - 5.4;
        }

        const result = `Body Fat: ${bodyFat.toFixed(1)}%
BMI: ${bmi.toFixed(1)}`;

        document.getElementById('bf-result').textContent = result;
    }

    calculateCalories() {
        const weight = parseFloat(document.getElementById('cal-weight').value);
        const duration = parseFloat(document.getElementById('cal-duration').value);
        const activity = document.getElementById('cal-activity').value;

        if (!weight || !duration) {
            this.showError('Please enter weight and duration');
            return;
        }

        const metValues = {
            'walking': 3.5,
            'running': 9.8,
            'cycling': 8.0,
            'swimming': 6.0,
            'gym': 5.0
        };

        const met = metValues[activity] || 3.5;
        const calories = (met * weight * duration) / 60;

        const result = `Calories Burned: ${calories.toFixed(0)} kcal
Activity: ${activity.charAt(0).toUpperCase() + activity.slice(1)}
Duration: ${duration} minutes`;

        document.getElementById('cal-result').textContent = result;
    }

    convertLength() {
        const value = parseFloat(document.getElementById('length-value').value);
        const from = document.getElementById('length-from').value;
        const to = document.getElementById('length-to').value;

        if (!value) {
            this.showError('Please enter a value');
            return;
        }

        const conversions = {
            'mm': 1,
            'cm': 10,
            'm': 1000,
            'km': 1000000,
            'in': 25.4,
            'ft': 304.8,
            'yd': 914.4,
            'mi': 1609344
        };

        const result = (value * conversions[from]) / conversions[to];

        document.getElementById('length-result').textContent = `${value} ${from} = ${result.toFixed(6)} ${to}`;
    }

    convertWeight() {
        const value = parseFloat(document.getElementById('weight-value').value);
        const from = document.getElementById('weight-from').value;
        const to = document.getElementById('weight-to').value;

        if (!value) {
            this.showError('Please enter a value');
            return;
        }

        const conversions = {
            'mg': 1,
            'g': 1000,
            'kg': 1000000,
            'oz': 28349.5,
            'lb': 453592,
            'ton': 1000000000
        };

        const result = (value * conversions[from]) / conversions[to];

        document.getElementById('weight-result').textContent = `${value} ${from} = ${result.toFixed(6)} ${to}`;
    }

    convertTemperature() {
        const value = parseFloat(document.getElementById('temp-value').value);
        const from = document.getElementById('temp-from').value;
        const to = document.getElementById('temp-to').value;

        if (!value && value !== 0) {
            this.showError('Please enter a value');
            return;
        }

        let celsius = value;
        
        // Convert to Celsius first
        if (from === 'f') {
            celsius = (value - 32) * 5/9;
        } else if (from === 'k') {
            celsius = value - 273.15;
        }

        // Convert from Celsius to target
        let result = celsius;
        if (to === 'f') {
            result = (celsius * 9/5) + 32;
        } else if (to === 'k') {
            result = celsius + 273.15;
        }

        document.getElementById('temp-result').textContent = `${value}°${from.toUpperCase()} = ${result.toFixed(2)}°${to.toUpperCase()}`;
    }

    calculateTime() {
        const hours = parseFloat(document.getElementById('time-hours').value) || 0;
        const minutes = parseFloat(document.getElementById('time-minutes').value) || 0;
        const seconds = parseFloat(document.getElementById('time-seconds').value) || 0;

        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        const totalMinutes = totalSeconds / 60;
        const totalHours = totalSeconds / 3600;

        const result = `Total Time:
${totalHours.toFixed(2)} hours
${totalMinutes.toFixed(2)} minutes
${totalSeconds} seconds`;

        document.getElementById('time-result').textContent = result;
    }

    calculateAge() {
        const birthDate = document.getElementById('birth-date').value;

        if (!birthDate) {
            this.showError('Please select a birth date');
            return;
        }

        const birth = new Date(birthDate);
        const today = new Date();
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        const daysDiff = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(daysDiff / 7);
        const months = Math.floor(daysDiff / 30.44);

        const result = `Age: ${age} years
${months} months
${weeks} weeks
${daysDiff} days`;

        document.getElementById('age-result').textContent = result;
    }

    startStopwatch() {
        if (!this.stopwatchRunning) {
            this.stopwatchRunning = true;
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime++;
                this.updateStopwatchDisplay();
            }, 1000);
        }
    }

    pauseStopwatch() {
        this.stopwatchRunning = false;
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
        }
    }

    resetStopwatch() {
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
        }
        this.updateStopwatchDisplay();
    }

    updateStopwatchDisplay() {
        const hours = Math.floor(this.stopwatchTime / 3600);
        const minutes = Math.floor((this.stopwatchTime % 3600) / 60);
        const seconds = this.stopwatchTime % 60;

        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('stopwatch-display').textContent = display;
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CalQuora();
});

// Add some utility functions for advanced calculations
class MathUtils {
    static integrate(func, a, b, n = 1000) {
        // Simple trapezoidal rule
        const h = (b - a) / n;
        let sum = (func(a) + func(b)) / 2;
        
        for (let i = 1; i < n; i++) {
            sum += func(a + i * h);
        }
        
        return sum * h;
    }
    
    static derivative(func, x, h = 1e-6) {
        return (func(x + h) - func(x - h)) / (2 * h);
    }
    
    static limit(func, x, direction = 0) {
        const h = direction === 0 ? 1e-10 : direction * 1e-10;
        return func(x + h);
    }
}

// Add smooth scrolling and animations
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth transitions to all buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
        });
    });
    
    // Add loading animation to calculate buttons
    const calculateBtns = document.querySelectorAll('.btn-calculate');
    calculateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.add('loading');
            setTimeout(() => {
                btn.classList.remove('loading');
            }, 1000);
        });
    });
});
