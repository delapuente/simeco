/**
 * The namespace SIMECO holds simulator core functionallity and classes.
 * Requires jQuery >= 1.0
 */
var SIMECO = new (function($) {
	var self = this;

	var uniqueId = 0;
	function getUniqueId() {
		uniqueId++;
		return uniqueId;
	}
	
	function getRandomInt(min, max) {  
	  return Math.floor(Math.random() * (max - min + 1)) + min;  
	}  

	/**
	 * Keep the following names:
	 *	UNEMPLOYED
	 *	WORKER
	 *	ENTREPENEUR
	 *
	 * @enumerate
	 */
	var EmploymentStatus = {
		UNEMPLOYED: 'UNEMPLOYED',
		WORKER: 'WORKER',
		ENTREPRENEUR: 'ENTREPRENEUR'
	};
	
	/**
	 * Represent a company in very basic terms.
	 * 
	 * @param options a dictionary with the following values:
	 *	entrepreneurs: number of entrepreneurs to share the benefits of the company
	 *	size: size of the company in number of workers
	 *	productPrice: price of each product
	 *	stock: initial amount of products in stock
	 *	salary: salary per worker
	 *	unitsByWorker: how many products are manufactured by worker each time
	 * All these options are available from the object itself.
	 *
	 * @constructor
	 */
	function Company(options) {
		var self = this;
		var id = getUniqueId();
		var sold = 0;

		options = options || {};
		$.extend(
			self, 
			{
				entrepreneurs : 5,
				size: 150,
				productPrice: 10,
				stock: 1000,
				salary: 1000,
				unitsByWorker: 5
			},
			options
		);

		self.__defineGetter__('id', function() { return id; });
		
		/**
		 * Current sold products
		 *
		 * @getter
		 * @setter
		 */
		self.__defineGetter__('sold', function() { return sold; });
		self.__defineSetter__('sold', function(v) { sold = v; });
		
		/**
		 * Deserialize JSON data or object skeleton (obtained parsing JSON data).
		 * @param string with JSON data or a skeleton object result of parsing JSON data.
		 * @getter
		 */
		function load(skel) {
			if (typeof skel === 'string') { skel = JSON.parse(skel); }

			$.each(skel, function(key, value) {
				if (key === 'id') { id = value; }
				else { self[key] = value; }
			});
			
			return id;
		}
		self.__defineGetter__('load', function() { return load; });
		
		/**
		 * Add reservation of the product.
		 * @param howMany how many items to be reserved
		 * @param who whoe did the reservation
		 * @getter
		 */
		var reservations = {};
		function reserve(howMany, who) {
			reservations[who.id] = {customer: who, count:howMany};
		}
		self.__defineGetter__('reserve', function() { return reserve; });
		
		/**
		 * Clear reservations
		 * @getter
		 */
		function clearReservations() {
			reservations = {};
		}
		self.__defineGetter__('clearReservations', function() { return clearReservations; });
		
		/**
		 * @return total reservations
		 * @getter
		 */
		function getTotalReservations() {
			var total = 0;
			$.each(reservations, function(personId, reservation) {
				total += reservation.count;
			});
			return total;
		};
		self.__defineGetter__('getTotalReservations', function() { return getTotalReservations;	});
		
		/**
		 * @param customer Person instance to get how many reserved items she has
		 * (null if she is not a costumer)
		 * @return how many items bought by the customer given
		 * @getter
		 */
		function getReservation(customer) {
			var reservation = reservations[customer.id];
			if (typeof reservation === 'undefined') {
				return null;
			}
			return reservation.count;
		};
		self.__defineGetter__('getReservation', function() { return getReservation;	});
		
		/**
		 * @return customer list
		 * @getter
		 */
		self.__defineGetter__('customers', function() {
			var customers = [];
			$.each(reservations, function(id, reservation) {
				customers.push(reservation.customer);
			});
			return customers;
		});
	};

	/**
	 * Represent an individual of the simulation population.
	 * 
	 * @param options a dictionary with the following values:
	 *	savings: amount of money which the person starts
	 *	expenses: how much money the person will expend each time
	 * All these options are available from the object itself.
	 *
	 * @constructor
	 */
	function Person (options) {
		var self = this;
		var id = getUniqueId();
		var employmentStatus = EmploymentStatus.UNEMPLOYED;
		var salary = 0;
		var productsConsumed = 0;
		var companyId = null;
		
		options = options || {};
		$.extend(
			this, 
			{
				savings : 1200,
				expenses: 300,
			},
			options
		);
		
		/**
		 * Deserialize JSON data or object skeleton (obtained parsing JSON data).
		 * @param string with JSON data or a skeleton object result of parsing JSON data.
		 * @getter
		 */
		function load(skel) {
			if (typeof skel === 'string') { skel = JSON.parse(skel); }

			$.each(skel, function(key, value) {
				if (key === 'id') { id = value; }
				else { self[key] = value; }
			});
			
			return id;
		}
		self.__defineGetter__('load', function() { return load; });

		/**
		 * Return the unique id of the person
		 *
		 * @getter
		 */
		self.__defineGetter__('id', function() { return id; });
		
		/**
		 * Reflect the employment status of the person
		 *
		 * @getter
		 * @setter
		 */
		self.__defineGetter__('employmentStatus', function() {
			return employmentStatus;
		});
		self.__defineSetter__('employmentStatus', function(v) {
			employmentStatus = v;
		});
		
		/**
		 * Id of the company which the person is related to. It
		 * is 0 if the Person is UNEMPLOYED.
		 *
		 * @getter
		 * @setter
		 */
		self.__defineGetter__('companyId', function() {
			return companyId;
		});
		self.__defineSetter__('companyId', function(v) {
			companyId = v;
		});

		/**
		 * Current salary of the person
		 *
		 * @getter
		 * @setter
		 */
		self.__defineGetter__('salary', function() { return salary; });
		self.__defineSetter__('salary', function(v) { salary = v; });
		
		/**
		 * How many products have been consumed by the person. It directly
		 * depends on expenses.
		 *
		 * @getter
		 * @setter
		 */
		self.__defineGetter__('productsConsumed', function() {
			return productsConsumed;
		});
		self.__defineSetter__('productsConsumed', function(v) {
			productsConsumed = v;
		});
	};
	
	function Simulation() {
		var self = this;
		
		self.totalProdConsumidos = function() {
			var total = 0;
			for (var i=0, person; person = population[i]; i++) {
				total += person.productsConsumed;
			}
			return total;
		}

		var companies = [];
		var companiesById = {};
		var population = [];

		var time = 0;
		var snapshots = [];
		var started = false;
		
		/**
		 * Current time
		 * @getter
		 */
		self.__defineGetter__('currentTime', function() { return time; });
		
		/**
		 * Return true if simulation has started
		 * @getter
		 */
		self.__defineGetter__('hasStarted', function() { return started; });
		
		/**
		 * Return an object with all information of the current simulation.
		 * You can use a JSON serializer to save the object and it can be
		 * restored with load().
		 * @return a object with all information of the current simulation. Can be restored
		 * with load().
		 * @getter
		 */
		function save() {
			var dumpeddata = {snapshots:snapshots, time:time, started:started };
			return dumpeddata;
		}
		self.__defineGetter__('save', function() { return save; });
		
		/**
		 * Restore simulation from an object. This object can be obtained by using save()
		 * @param data a the object to restore the simulation from (it can be a
		 * JSON string, if so, it is parsed before)
		 * @getter
		 */
		function load(data) {
			if (typeof data === 'string') { data = JSON.parse(data); }
			
			// Restore simulation historical data
			time = data.time;
			started = data.started;
			snapshots = data.snapshots;
			
			// Restore population
			var lastSnapshot = data.snapshots[data.snapshots.length-1];
			population = []; uniqueId = 0;
			$.each(lastSnapshot.population, function(index, skel) {
				var person = new Person();
				var id = person.load(skel);
				if (id > uniqueId) { uniqueId = id; }
				population.push(person);
			});
			
			// Restore companies
			companies = [];
			$.each(lastSnapshot.companies, function(index, skel) {
				var company = new Company();
				var id = company.load(skel);
				if (id > uniqueId) { uniqueId = id; }
				companies.push(company);
				companiesById[company.id] = company;
			});
		}
		self.__defineGetter__('load', function() { return load; });
		
		/**
		 * Reset the simulation
		 * @getter
		 */
		function resetSimulation() {
			companies = [];
			population = [];

			time = 0;
			snapshots = [];
			started = false;
		}
		self.__defineGetter__('reset', function() { return resetSimulation; });

		/**
		 * Add a new company and return company's id
		 * @param options a dictionary with the following keys:
		 *	entrepreneurs: number of entrepreneurs to share the benefits of the company
		 *	size: size of the company in number of workers
		 *	productPrice: price of each product
		 *	stock: initial amount of products in stock
		 *	salary: salary per worker
		 *	unitsByWorker: how many products are manufactured by worker each time
		 * @return the company's id
		 * @getter
		 */
		function addCompany(options) {
			var company = new Company(options);
			var id = company.id;
			companies.push(company);
			companiesById[id] = company;
			//console.log(company);
			return id;
		}
		self.__defineGetter__('addCompany', function() {
			return addCompany;
		});
		
		/**
		 * Change a company.
		 * @param id of the company. The id is returned by addCompany() method.
		 * @param options a dictionary accepting same keys than addCompany().
		 * @getter
		 */
		function redefineCompany(companyId, options) {
			var company = companiesById[companyId];
			if (!company) {
				var message = 'There is no company with id ' + companyId;
				message	+= '. Use addCompany() to define companies. ';
				message += 'The method returns the company id';
				throw message;
			}
			$.extend(company, options);
			//console.log(company);
		}
		self.__defineGetter__('redefineCompany', function() {
			return redefineCompany;
		});
		
		/**
		 * Define population. All people inside the population share
		 * same initial parameters.
		 * @param size size of the population
		 * @param options a dictionary with the following keys:
		 *	savings: amount of money which the person starts
		 *	expenses: how much money the person will expend each time
		 * @getter
		 */
		function definePopulation(size, options) {
			population = [];
			for (var i=0; i<size; i++) {
				population.push(new Person(options));
			}
			//console.log(population);
		}
		self.__defineGetter__('definePopulation', function() {
			return definePopulation;
		});
		
		/**
		 * Redefine parameters of the current population. It
		 * does not change the size of the population.
		 * @param options a dictionary with the same keys than
		 * definePopulaiton()
		 * @getter
		 */
		function redefinePopulation(options) {
			for (var i=0, person; person = population[i]; i++) {
				$.extend(person, options);
			}
			//console.log(population);
		}
		self.__defineGetter__('redefinePopulation', function() {
			return redefinePopulation;
		});

		/**
		 * The average of expenses of the population.
		 * @throw PreconditionFail if population size is 0 or it was not defined.
		 * @getter
		 */
		function getAverageExpenses() {
			if (population.length == 0) {
				throw new PreconditionFail({populationDefined:false});
			}

			var totalExpenses = 0;
			for (var i=0, person; person = population[i]; i++) {
				totalExpenses += person.expenses;
			}
			return totalExpenses / population.length;
		}
		
		/**
		 * The average of savings of the population.
		 * @throw PreconditionFail if population size is 0 or it was not defined.
		 * @getter
		 */
		function getAverageSavings() {
			if (population.length == 0) {
				throw new PreconditionFail({populationDefined:false});
			}

			var totalSavings = 0;
			for (var i=0, person; person = population[i]; i++) {
				totalSavings += person.savings;
			}
			return totalSavings / population.length;
		}
		
		/**
		 * How much unemployed population there are.
		 * @throw PreconditionFail if population size is 0 or it was not defined.
		 * @getter
		 */
		function getUnemployed() {
			if (population.length == 0) {
				throw new PreconditionFail({populationDefined:false});
			}

			var totalUnemployed = 0;
			for (var i=0, person; person = population[i]; i++) {
				if (person.employmentStatus === EmploymentStatus.UNEMPLOYED) {
					totalUnemployed++;
				}
			}
			return totalUnemployed;
		}
		
		/**
		 * How much money there are in the simulation.
		 * @throw PreconditionFail if population size is 0 or it was not defined.
		 * @getter
		 */
		function getMoney() {
			if (population.length == 0) {
				throw new PreconditionFail({populationDefined:false});
			}

			var totalSavings = 0;
			for (var i=0, person; person = population[i]; i++) {
				if (person.employmentStatus !== EmploymentStatus.ENTREPRENEUR) {
					totalSavings += person.savings;
				}
			}
			return totalSavings;
		}
		
		/**
		 * Take a snapshot of the current statistics.
		 */
		function takeSnapshot() {
			var newshot = {
				population : JSON.parse(JSON.stringify(population)),
				companies : JSON.parse(JSON.stringify(companies)),
				unemployed : getUnemployed(),
				money: getMoney(),
				averageSavings: getAverageSavings(),
				averageExpenses: getAverageExpenses()
			};
			snapshots.push(newshot);
			return newshot;
		}
		
		/**
		 * Return statistics for a given moment.
		 *
		 * @parameter @optional time time for the statistics. If omitted,
		 * current moment is selected by default. The parameter saturates
		 * to 0 if lower than 0 or to the current moment if greater.
		 *
		 * @return a set of statistics for the given moment. The forma of
		 * statistics object is:
		 * 		population : a copy of the population at the given moment,
		 *		companies : a copy of the companies at the given moment,
		 * 		unemployed : number of unemployed people,
		 *		money : mony of the population without entrepreneurs savings,
		 * 		averageSavings: average of the population's saviings,
		 *		averageExpenses: average of the population's expenses
		 *
		 * @getter
		 */
		self.__defineGetter__('getStatistics', function() {
			return function(time) {
				if (time === undefined || time >= snapshots.length) { time = snapshots.length - 1; }
				if (time < 0) { time = 0; }
				return $.extend(true, {}, snapshots[time]);
			}
		});
		
		/**
		 * Contains flags to determine which simulation preconditions
		 * have fail. These can be accessed as properties and are:
		 *	companiesDefined: false if there are no companies defined.
		 *		See addCompany() method.
		 *	populationDefined: false if no population is defined.
		 *		See definePopulation() method.
		 *	enoughEntrepreneurs: false if there are more companies than population.
		 *
		 *  TODO: Confirm this constrain!
		 *	enoughPositions: false if there are more positions than population (too much positions).
		 * @constructor
		 */
		function PreconditionFail(conditions) {
			$.extend(this, conditions);
		}
		self.__defineGetter__('PreconditionFail', function() { return PreconditionFail; });
		
		/**
		 * Check preconditions needed to perform a simulation.
		 * @return a dictionay with flags representing preconditions satisfied.
		 * 		See PreconditionFail for more information.
		 */
		function checkPreconditions() {
			var positions = 0;
			for (var i=0, company; company = companies[i]; i++) {
				positions += company.entrepreneurs + company.size;
			}
			
			var conditions = {
				companiesDefined: companies.length > 0,
				populationDefined: population.length > 0
			};
			
			if (conditions.companiesDefined && conditions.populationDefined) {
				conditions.enoughEntrepreneurs = companies.length <= population.length;
				conditions.enoughPositions = positions <= population.length;
			}
			
			return conditions;
		}
		self.__defineGetter__('checkPreconditions', function() { return checkPreconditions; });
		
		/**
		 * Setup the simulaiton. It is possible to throw an exception
		 * if preconditions fail.
		 * @throw PreconditionFail if some precondition fail.
		 * @getter 
		 */
		function startSimulation() {			
			
			/**
			 * Randomly choose those persons who will be the entrepreneurs for each
			 * company.
			 */
			function assignEntrepreneurs() {
				for (var i=0, company; company = companies[i]; i++) {
					for (var j=0; j<company.entrepreneurs; j++) {
						var person = population[getRandomInt(0, population.length-1)];
						while (person.employmentStatus !== EmploymentStatus.UNEMPLOYED) {
							person = population[getRandomInt(0, population.length-1)];
						}
						person.employmentStatus = EmploymentStatus.ENTREPRENEUR;
						person.companyId = company.id;
					}
				}
			}
			
			/**
			 * Randomly choose those persons who will be the workers for each
			 * company.
			 */
			function assignWorkers() {
				for (var i=0, company; company = companies[i]; i++) {
					for (var j=0; j<company.size; j++) {
						var person = population[getRandomInt(0, population.length-1)];
						while (person.employmentStatus !== EmploymentStatus.UNEMPLOYED) {
							person = population[getRandomInt(0, population.length-1)];
						}
						person.employmentStatus = EmploymentStatus.WORKER;
						person.salary = company.salary;
						person.companyId = company.id;
					}
				}
			}
			
			var conditions = checkPreconditions();
			var isAllOk = conditions.companiesDefined
					&& conditions.populationDefined
					&& conditions.enoughEntrepreneurs
					&& conditions.enoughPositions;
			if (isAllOk) {
				assignEntrepreneurs();
				assignWorkers();
				
				takeSnapshot();
				started = true;
			} else {
				throw new PreconditionFail(conditions);
			}
		}
		self.__defineGetter__('startSimulation', function() {
			return startSimulation;
		});
		
		/**
		 * Advance the simulation one step incrementing current time by one.
		 */
		function nextStep() {
			function setup() {
				for (var i=0, company; company = companies[i]; i++) {
					company.clearReservations();
				}
			}
		
			function produce() {
				for (var i=0, company; company = companies[i]; i++) {
					company.stock += company.size * company.unitsByWorker;
				}
			}
			
			function paySalaries() {
				for (var i=0, person; person = population[i]; i++) {
					person.savings += person.salary;
				}
			}
		
			var CONSUMPTION_LIMIT = 50;
			function computeExpenses() {
				for (var i=0, person; person = population[i]; i++) {
					// Randomly select a product
					var company = companies[getRandomInt(0, companies.length-1)];
					var price = company.productPrice;
					
					// Compute max units of producto to be bought
					person.productsConsumed = Math.floor(person.expenses / price);
					//person.productsConsumed = person.expenses / price;
					if (person.productsConsumed > CONSUMPTION_LIMIT) { person.productsConsumed = CONSUMPTION_LIMIT; }
					person.expenses = person.productsConsumed * price;
					
					// He has enough savings, deduce expenses
					if (person.expenses <= person.savings) {
						person.savings -= person.expenses;
					
					// He has not enought savings, expend within possibilities
					} else if (person.savings > 0) {
						person.productsConsumed = Math.floor(person.savings / price);
						//person.productsConsumed = person.savings / price;
						person.expenses = person.productsConsumed * price;	
						person.savings -= person.expenses;
						
					// He has no savings, dont expend
					} else {
						person.productsConsumed = 0;
						person.expenses = 0;
					}
					
					// Keep track of who buy and how many
					if (person.productsConsumed > 0) {
						company.reserve(person.productsConsumed, person)
					}
				}
			}
			
			/**
			 * Randomly payback population with determined number of items at a given price.
			 * @param company which company has to pay back
			 * @param count how many items to return
			 */
			function payBack(company, count) {
				var customers = company.customers;
				var price = company.productPrice;
				var cindex = 0;
				while (count > 0) {
					var units = count >= 1 ? 1 : count;
					var cost = units * price;
					var customer = customers[cindex];
					var reservation = company.getReservation(customer);
					if (reservation > 0) {
						customer.savings += cost;
						customer.expenses -= cost;
						customer.productsConsumed -= units;
						company.reserve(reservation-1, customer);
					
						count -= units;
					}
					cindex = (cindex + 1) % customers.length;
				}
			}
			
			function lookForEntrepreneurs(companyId) {
				var entrepreneurs = [];
				for (var i=0, person; person = population[i]; i++) {
					if (person.employmentStatus === EmploymentStatus.ENTREPRENEUR && person.companyId === companyId) {
						entrepreneurs.push(person);
					}
				}
				return entrepreneurs;
			}
			
			function computeEntrepreneurSavings(company, sold) {
				var entrepreneurs = lookForEntrepreneurs(company.id);

				var earnings = sold * company.productPrice;
				var expenses = company.salary * company.size;
				var earningsPerEntrepreneur = earnings / company.entrepreneurs;
				var expensesPerEntrepreneur = expenses / company.entrepreneurs;

				for (var i=0, entrepreneur; entrepreneur = entrepreneurs[i]; i++) {
					entrepreneur.savings += earningsPerEntrepreneur;
					entrepreneur.savings -= expensesPerEntrepreneur;
				}
			}
			
			function computeSalaries(company, unemployed) {
				var salaryModified = false;
				
				var unemployed = 0;
				for (var i=0, person; person = population[i]; i++) {
					if (person.employmentStatus === EmploymentStatus.UNEMPLOYED) {
						unemployed++;
					}
				}
				
				// If unemployed are greater than 15% of population, decrease salary by 1%
				if (unemployed > population.length * 0.15) {
					company.salary -= 0.01 * company.salary;
					salaryModified = true;
				
				// If unemployed are lower than 10% of population, increase salary by 1%
				} else if (unemployed < population.length * 0.10) {
					company.salary += 0.01 * company.salary;
					salaryModified = true;
				}
				
				if (salaryModified) {
					for (var i=0, person; person = population[i]; i++) {
						if (person.employmentStatus === EmploymentStatus.WORKER && person.companyId === company.id) {
							person.salary = company.salary;
						}
					}
				}
			}
			
			function hirePerson(company) {
				// Check for unemployed
				var unemployedFound = false;
				for (var i=0, person; person = population[i]; i++) {
					if (person.employmentStatus === EmploymentStatus.UNEMPLOYED) {
						unemployedFound = true;
						break;
					}
				}
				
				if (unemployedFound) {
					// Randomly choose a person to hire
					var personToHire = population[getRandomInt(0, population.length-1)];
					while (personToHire.employmentStatus !== EmploymentStatus.UNEMPLOYED) {
						personToHire = population[getRandomInt(0, population.length-1)]
					}
					
					personToHire.companyId = company.id;
					personToHire.employmentStatus = EmploymentStatus.WORKER;
					personToHire.salary = company.salary;
					company.size++;
				}
			}
			
			var MIN_CONSUMPTION = 5;
			function firePerson(company) {
				// Randomly choose a person to fire
				var personToFire = population[getRandomInt(0, population.length-1)];
				while (personToFire.employmentStatus !== EmploymentStatus.WORKER || personToFire.companyId !== company.id) {
					personToFire = population[getRandomInt(0, population.length-1)]
				}
				
				personToFire.companyId = 0;
				personToFire.employmentStatus = EmploymentStatus.UNEMPLOYED;
				personToFire.salary = 0;
				personToFire.expenses = MIN_CONSUMPTION * company.productPrice;
				
				company.size--;
			}

			var MIN_STOCK = 100;
			function computeSize(company, demand, sold) {
				var entrepreneursExpenses = 0;
				var entrepreneurs = lookForEntrepreneurs(company.id);
				for (var i=0, entrpreneur; entrepreneur = entrepreneurs[i]; i++) {
					entrepreneursExpenses += entrepreneur.expenses;
				}
				
				var toHire = 0;
				var toFire = 0;
				
				// Compute people to hire / to fire
				
				// If profit is greater than expenses, hire people
				var remainder = (sold * company.productPrice) - ((company.size * company.salary) + entrepreneursExpenses);
				if (remainder > 0) {
					toHire++;
				
				// If it is lower, fire people
				} else if (remainder < 0) {
					toFire++;
				}
				
				// If demand is greater than sold, hire people
				remainder = demand - sold;
				if (remainder > 0) {
					toHire++;
				
				// If it is lower, fire people
				} else if (remainder < 0) {
					toFire++;
				}
				
				// If stock is under minimum, hire people
				if (company.stock <= MIN_STOCK) {
					toHire++;
				} else {
					toFire++;
				}
				
				// TODO: Qué pasa si son iguales
				if (toHire > toFire) {
					var count = toHire - toFire;
					for (var i=0; i < count; i++) {
						hirePerson(company);
					}
				} else if (toFire > toHire) {
					var count = toFire - toHire;
					for (var i=0; i < count; i++) {
						if (company.size > 0) { firePerson(company); }
					}
				}
			}
			
			function computeProductPrice(company, sold) {
				var volume = company.size * company.unitsByWorker;
				if (sold > volume * 1.05) {
					company.productPrice += company.productPrice * 0.01;
				} else if (sold > volume * 0.95) {
					company.productPrice -= company.productPrice * 0.01;
				}
			}
			
			function updateCompanyInfo() {				
				for (var i=0, company; company = companies[i]; i++) {
					// Compute stock
					var demand = company.getTotalReservations();
					if (demand > company.stock) {
						company.sold = company.stock;
						payBack(company, demand - company.sold);
					} else {
						company.sold = demand;
					}
					company.stock -= company.sold;
					
					// TODO: Refactor to remove company.sold (it is already in company)
					computeEntrepreneurSavings(company, company.sold);
					computeSalaries(company);
					computeSize(company, demand, company.sold);
					computeProductPrice(company, company.sold);
				}
			}
			
			function updateExpenses() {
				var price = companies[0].productPrice;
				for (var i=0, person; person = population[i]; i++) {
					if ( (person.productsConsumed < CONSUMPTION_LIMIT) && (person.productsConsumed >= MIN_CONSUMPTION) ) {
						if ( (person.salary >= person.expenses * 1.10) || (person.savings >= person.expenses * 1.10) ) {
							if ( ((person.expenses * 1.10) / price) < CONSUMPTION_LIMIT ) {
								person.expenses *= 1.01;
							} else {
								person.expenses = CONSUMPTION_LIMIT * price;
							}
						} else if ( (person.salary <= person.expenses * 0.90) || (person.savings <= person.expenses * 0.90) ) {
							// TODO: Esto siempre es verdad, no?
							if (person.expenses * 0.90 > 0) {
								person.expenses *= 0.99;
							} else {
								person.expenses = 0;
							}
						}
					
					} else if (person.productsConsumed >= 0 && person.productsConsumed < MIN_CONSUMPTION && person.savings >= MIN_CONSUMPTION * price) {
						person.expenses = MIN_CONSUMPTION * price;
					}
				}
			}
			
			time++;
			setup();
			produce();
			paySalaries();
			computeExpenses();
			updateCompanyInfo();
			updateExpenses();
			takeSnapshot();
		}
		self.__defineGetter__('nextStep', function() {
			return nextStep;
		});
	};
	self.__defineGetter__('Simulation', function() { return Simulation; });
})(jQuery);