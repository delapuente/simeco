var simulation = null;
var companyId = null;
var history = {
	time: 0,
	unemployed: [],
	salary: [],
	money: [],
	savings: [],
	expenses: [],
	price: [],
	sold: [],
	stock: [],
	production: []
};
var chart = null;

function reset () {
	// Simulation
	simulation.reset();
	companyId = null;

	// Chart
	history.time = 0;
	if (chart) { chart.destroy(); }
	
	// GUI: Define regions
	$('#config-section .slide').slider('enable');
	$('#config-section input').removeAttr('readonly');
	$('#config-section .define').button('enable').show();
	$('#config-section .redefine').button('disable').hide();
	
	// GUI: Control
	$('#start-simulation').button('enable');
	$('#define-company').button('enable');
	$('#next-step').button('disable');
	$('#next-ten-steps').button('disable');
	
	// GUI: Series
	$('.current-data').text();
	
	// GUI: Error
	$('#simulation-precondition-errors li').hide();
}

$(document).ready(function() {
	// Only one simulation
	simulation = new SIMECO.Simulation();

	// Configure slides
	$('#config-section .slide').slider({
		range: 'min',
		value: 5,
		min: 1,
		slide: function(e, ui) {
			var $input = $('#'+this.id+'-input');
			$input.val(ui.value);
		}
	});
	$('#company-entrepreneurs').slider('option', 'max', 10);
	$('#company-size').slider('option', 'max', 500);
	$('#company-product-price').slider('option', 'max', 1000);
	$('#company-stock').slider('option', 'max', 5000);
	$('#company-salary').slider('option', 'max', 5000);
	$('#company-units-by-worker').slider('option', 'max', 30);
	
	$('#population-count').slider('option', 'max', 1500);
	$('#person-savings').slider('option', 'max', 5000);
	$('#person-expenses').slider('option', 'max', 5000);

	// Bind inputs to sliders
	function onSlideInputChange(e) {
		var $slide = $('#'+this.id.substring(0, this.id.length-6));
		var value = new Number($(this).val());
		if (!isNaN(value)) {
			$slide.slider('value', value);
		}
	}
	
	$('#config-section input').keyup(onSlideInputChange);
	$('#config-section input').change(onSlideInputChange);
	$('#config-section input').change();
	
	// Error messages
	$('#config-section .error-area')
		.text('El valor debe ser un número mayor que 1. Use el punto como separador decimal.')
		.addClass('ui-state-error')
		.hide();
		
	// Buttons
	
	// Reset simulation
	$('#reset-simulation').button({
		text: false,
		icons: {
			primary: 'ui-icon-refresh'
		}
	}).click(reset);
	
	// Save simulation
	$('#save-simulation').button({
		text: false,
		icons: {
			primary: 'ui-icon-disk'
		}
	}).click(function() {
	
		// Shown series
		var series = {};
		$('#chart-options input').each(function() {
			series[this.id] = $(this).attr('checked') ? true : false;
		});
			
		$('#export textarea').text(			
			JSON.stringify({
				core:simulation.save(),
				gui:{series:series, companyId:companyId},
				serializationInfo:'SIMECO JS 1.0'
			}, null, '    ')
		);
		$('#export').dialog('open');
	});
	
	$('#load-simulation').button({
		text: false,
		icons: {
			primary: 'ui-icon-folder-open'
		}
	}).click(function() {
		$('#import').dialog('open');
	});
	
	// Start simulation
	$('#start-simulation').button({
		text: false,
		icons: {
			primary: 'ui-icon-play'
		}
	}).click(function() {
		try {
			simulation.startSimulation();
			logStatistics();
			plot();
			postStartSimulation();
		} catch (ex) {
			if (ex instanceof simulation.PreconditionFail) {
				$.each(ex, function(precondition, passed) {
					if (passed) { $('#precondition-'+precondition).hide(); }
					else { $('#precondition-'+precondition).show(); }
				});
				$("#simulation-precondition-errors").dialog('open');
			
			} else {
				alert('Exception!\n'+ex);
				throw ex;
			}
		}
	});
	
	// Next step
	$('#next-step').button({
		text: false,
		icons: {
			primary: 'ui-icon-seek-next'
		}
	}).click(function() {
		simulation.nextStep();
		advance();
		plot();
	});
	
	// Next 10 steps
	$('#next-ten-steps').button({
		text: false,
		icons: {
			primary: 'ui-icon-seek-end'
		}
	}).click(function() {
		for (var i=0; i<10; i++) {
			simulation.nextStep();
			advance();
		}
		plot();
	});
	
	// Reset zoom
	$('#reset-zoom').button({
		text: false,
		icons: {
			primary: 'ui-icon-arrow-4-diag'
		}
	}).click(function() {
		if (chart) { chart.resetZoom();	}
	});
	
	// Define buttons: company and population
	$('.define').button({
		icons: {
			primary: 'ui-icon-check'
		}
	});
	$('.redefine').button({
		icons: {
			primary: 'ui-icon-circle-check'
		}
	});
	
	// Define and redefine population
	$('#define-population').click(function() {
		definePopulation();
		postDefinePopulation();
	});
	$('#redefine-population').click(function() {
		redefinePopulation();
	});
	
	// Define and redefine company
	$('#define-company').click(function() {
		defineCompany();
		postDefineCompany();
	});
	$('#redefine-company').click(function() {
		redefineCompany();
	});
	
	// Chart options
	$('#chart-options input').change(function() {
		history[this.id.substring(0, this.id.length-6)].show = $(this).attr('checked') === 'checked';
		plot();
	});
	
	// Modal dialogs
	$('#simulation-precondition-errors').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				$(this).dialog("close");
			}
		},
		width: 700,
		resizable: false,
		draggable: false
	}).dialog('close');
	
	$('#import').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				restoreSimulation(JSON.parse($('#import textarea').val()));
				$(this).dialog('close');
			},
			Cancelar : function() {
				$(this).dialog('close');
			}
		},
		width: 700,
		resizable: false,
		draggable: false
	}).dialog('close');
	
	$('#export').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				$('textarea', $(this)).empty();
				$(this).dialog("close");
			}
		},
		width: 700,
		resizable: false,
		draggable: false
	}).dialog('close');

	reset();
});

function postStartSimulation() {
	$('#start-simulation').button('disable');
	$('#next-step').button('enable');
	$('#next-ten-steps').button('enable');
}

function postDefineCompany() {
	$('#company-section .only-define').slider('disable').attr('readonly', 'readonly');
		
	$('#define-company').hide();
	$('#redefine-company').button('enable').show();
}

function postDefinePopulation() {
	$('#population-section .only-define').slider('disable').attr('readonly', 'readonly');
		
	$('#define-population').hide();
	$('#redefine-population').button('enable').show();
}

function restoreSimulation(data) {
	reset(); 
	
	// Restore the internal status of the simulation
	if (typeof data.core === 'object') {
		simulation.load(data.core);
	}
	
	// Restore GUI
	preconditions = simulation.checkPreconditions();
	if (preconditions.companiesDefined) {
		postDefineCompany();
	}
	
	if (preconditions.populationDefined) {
		postDefinePopulation();
	}
	
	if (simulation.hasStarted) {
		postStartSimulation();
	}
	
	// Restore historical data
	var currentTime = simulation.currentTime;
	for (var t=0; t <= currentTime; t++) {
		advance();
	}
	plot();
	
	// Restore visible series
	$.each(data.gui.series, function(id, value) {
		var $input =  $('#'+id);
		if (value) { $input.attr('checked', 'checked'); }
		else { $input.removeAttr('checked'); }
		$input.change();
	});
	companyId = data.gui.companyId;
}

function setupChart() {
	// Force 9 series
	var fakeSeries = [
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]],
		[[0,0]]
	];
	chart = $.jqplot('chart', fakeSeries, {
		title : 'Gráfica de evolución',
		legend : {
			show : true,
			location : 'nw'
		},
		highlighter: {
			show: true,
			sizeAdjust: 7.5,
			formatString: 'Periodo %d: %.2f',
			bringSeriesToFront: true
		},
		cursor: {
			show: true,
			showTooltip: false,
			zoom: true,
		}
	});
	
	// Bind and configure each serie
	history.unemployed = chart.series[0];
	history.unemployed.label = 'Desempleados';
	history.salary = chart.series[1];
	history.salary.label = 'Salario del trabajador';
	history.money = chart.series[2];
	history.money.label = 'Ahorros';
	history.savings = chart.series[3];
	history.savings.label = 'Ahorro medio';
	history.expenses = chart.series[4];
	history.expenses.label = 'Gasto medio';
	
	history.price = chart.series[5];
	history.price.label = 'Precio';
	history.sold = chart.series[6];
	history.sold.label = 'Productos vendidos';
	history.stock = chart.series[7];
	history.stock.label = 'Stock';
	history.production = chart.series[8];
	history.production.label = 'Producción';
	
	$('#chart-options input').change();
}

function logStatistics() {
	// First setup
	if (history.time === 0) {
		setupChart();
	}
	
	var stats = simulation.getStatistics(history.time);
	//console.log(stats);
	
	// New statistics
	var index = history.time+1;
	history.unemployed.data[history.time] = [index, stats.unemployed];
	history.salary.data[history.time] = [index, stats.companies[0].salary];
	history.money.data[history.time] = [index, stats.money];
	history.savings.data[history.time] = [index, stats.averageSavings];
	history.expenses.data[history.time] = [index, stats.averageExpenses];
	
	history.price.data[history.time] = [index, stats.companies[0].productPrice];
	history.sold.data[history.time] = [index, stats.companies[0].sold];
	history.stock.data[history.time] = [index, stats.companies[0].stock];
	history.production.data[history.time] = [index, stats.companies[0].unitsByWorker * stats.companies[0].size];
	
	// Current values
	$('#person-expenses-input').val(stats.averageExpenses.toFixed(2)).change();
	$('#person-savings-input').val(stats.averageSavings.toFixed(2)).change();
	
	$('#company-product-price-input').val(stats.companies[0].productPrice.toFixed(2)).change();
	$('#company-stock-input').val(stats.companies[0].stock.toFixed(2)).change();
	$('#company-salary-input').val(stats.companies[0].salary.toFixed(2)).change();
	
	$.each(history, function(key) {
		if (key !== 'time') {
			$('#current-'+key).text(history[key].data[history[key].data.length-1][1].toFixed(2));
		}
	});
}

function advance() {
	logStatistics();
	history.time++;
}

function plot() {
	chart.replot({clear:true, resetAxes:true});
}

function checkInputData(where) {
	var isAllOk = true;
	var companyData = $('input', where);
	$.each(companyData, function(index, input) {
		var $input = $(input);
		var $errorArea = $input.parent().next();

		// It should be a numeric value greater than 0
		var numericVal = new Number($(input).val());
		if (isNaN(numericVal) || numericVal < $(this).attr('min')) {
			isAllOk = false;
			$errorArea.show();
		} else {
			$errorArea.hide();
		}
	});
	return isAllOk;
}

function defineCompany() {
	function gatherInputData() {
		return {
			entrepreneurs : Number($('#company-entrepreneurs-input').val()),
			size : Number($('#company-size-input').val()),
			productPrice : Number($('#company-product-price-input').val()),
			stock : Number($('#company-stock-input').val()),
			salary : Number($('#company-salary-input').val()),
			unitsByWorker : Number($('#company-units-by-worker-input').val())
		};
	}

	if (checkInputData($('#company-section'))) {
		options = gatherInputData();
		companyId = simulation.addCompany(options);
		$('#define-company').button('disable');
	}
}

function redefineCompany() {
	function gatherInputData() {
		return {
			productPrice : Number($('#company-product-price-input').val()),
			stock : Number($('#company-stock-input').val()),
			salary : Number($('#company-salary-input').val()),
			unitsByWorker : Number($('#company-units-by-worker-input').val())
		};
	}

	if (checkInputData($('#company-section'))) {
		options = gatherInputData();
		simulation.redefineCompany(companyId, options);
		$('#define-company').button('disable');
	}
}

function definePopulation() {
	function gatherInputData() {
		return {
			expenses:Number($('#person-expenses-input').val()),
			savings:Number($('#person-savings-input').val()),
		};
	}

	if (checkInputData($('#population-section'))) {
		options = gatherInputData();
		simulation.definePopulation(Number($('#population-count-input').val()), options);
	}
}

function redefinePopulation() {
	function gatherInputData() {
		return {
			expenses:Number($('#person-expenses-input').val()),
			savings:Number($('#person-savings-input').val()),
		};
	}

	if (checkInputData($('#population-section'))) {
		options = gatherInputData();
		simulation.redefinePopulation(options);
	}
}