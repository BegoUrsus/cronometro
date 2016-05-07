$(function() { 

	//////////////////////////////////////////////////////////
	// Variables generales
	//////////////////////////////////////////////////////////

	var pi = Math.PI;

	var ancho, alto, offSetX, offSetY;
	var f_valores, f_milesimas, escalaSegsMins;
	var svg_princ, grupoReloj; 


	ancho = 200;
	alto = 200;
	offSetX = ancho / 2;
	offSetY = alto / 2;


	var grosor = ancho / 10;
	var radio = ancho / 2;
	var radioMedio = radio - (grosor / 2);

	var t;
	var milesimas = 0;
	var clm = $("#crono_mins");
	var cls = $("#crono_secs");
	var clc = $("#crono_cent");
	var parcial = 0;
	var contador = 0;

	var estactil = false;
	
	var audiotick = new Audio('assets/Tick-DeepFrozenApps-397275646.mp3');
	var audionull = new Audio('assets/nullpoint1sec.mp3');
	var sonando = true;

	var arrParadas = [];

	//////////////////////////////////////////////////////////
	// Funciones para guardar y recuperar de localStorage
	//////////////////////////////////////////////////////////

	//colocamos las paradas almacenadas en el localStorage en el drop-down
	function localStorageADatos() {
		if (localStorage.paradas)
			arrParadas = JSON.parse(localStorage.paradas);
		if (localStorage.getItem('sonido') != null )
			sonando = JSON.parse(localStorage.sonido);
	}

	// almacenamos las paradas en el localStorage
	function datosALocalStorage() {
		if (arrParadas && arrParadas.length > 0)
			localStorage.paradas = JSON.stringify(arrParadas);
		else
			localStorage.paradas = "";
		localStorage.sonido = JSON.stringify(sonando);
	}

	
	//////////////////////////////////////////////////////////
	// Funciones generales 
	//////////////////////////////////////////////////////////

	// Conversión de grados a radianes
	Math.radians = function(degrees) {
		return degrees * Math.PI / 180;
	};

	// Conversion de radianes a grados
	Math.degrees = function(radians) {
		return radians * 180 / Math.PI;
	};

	function offsetX(radio, angulo, offset) {
		var radianes = Math.radians(angulo);
		var x = radio * Math.cos(radianes);
		return x * (radio + offset) / radio - x;
	}

	function offsetY(radio, angulo, offset) {
		var radianes = Math.radians(angulo);
		var x = radio * Math.sin(radianes);
		return x * (radio + offset) / radio - x;
	}

	escalaSegsMins = d3.scale.linear().domain([0, 59 + 59 / 60]).range([0, 2 * pi]);

	// covierte un objeto que guarda el tiempo en minutos, segundos y centesimas
	// a milesimas
	f_milesimas = function(dato) {
		var segundos = dato[2].valor * 60 + dato[1].valor;
		var centesimas = segundos * 100 + dato[0].valor;
		return centesimas * 10;
	}

	f_valores = function(milis) {
		var centesimas = Math.floor(milis/10);
		var segundos = Math.floor(centesimas / 100);
		centesimas = centesimas % 100;
		var minutos = Math.floor(segundos / 60);
		segundos = segundos % 60;

		return data = [
			{
				"unidad": "cents",
				"valor": centesimas
			},
			{
				"unidad": "seconds",
				"valor": segundos
			}, 
			{
				"unidad": "minutes",
				"valor": minutos
			}
		];
	}

	function muestraContParadas(contParadas) {
		var $badge = $("#badge_paradas");
		$badge.text(contParadas);
		$("#dropdown-paradas").prop('disabled', contador === 0 ? true : false);

	}

	function inicializar(){ 
		milesimas = 0;
		parcial = 0;
		contador = 0;
		cargaLista();
		muestraContParadas(contador);
		//dibujaManecillas(f_valores(milesimas));
		muestraHora(milesimas);
		clearInterval(t);  

	}

	function formateaTiempo(milesimas) {
		var centesimas = Math.floor(milesimas/10);
		var segundos = Math.floor(centesimas / 100);
		centesimas = centesimas % 100;
		var minutos = Math.floor(segundos / 60);
		segundos = segundos % 60;

		return {
			strmins: ("00" + minutos).substr(-2,2),
			strsecs: ("00" + segundos).substr(-2,2),
			strcent: ("00" + centesimas).substr(-2,2)
		}
	}
	
	function formateaf_valores(dato) {
		return {
			strmins: ("00" + dato[2].valor).substr(-2,2),	
			strsecs: ("00" + dato[1].valor).substr(-2,2),	
			strcent: ("00" + dato[0].valor).substr(-2,2)			
		}
	}
	
	function muestraHora(milesimas) {
		var resultado = formateaTiempo(milesimas);

		clm.html(resultado.strmins);
		cls.html(resultado.strsecs);
		clc.html(resultado.strcent);
	}

	function dibujaReloj() {

		// Añadimos un SVG al div que tiene como clase "reloj" 
		d3.select("svg").remove();
		svg_princ = d3.selectAll(".reloj")
			.append("svg:svg")
			.attr("width", ancho)
			.attr("height", alto);

		// Creamos los gradientes para el relleno de los círculos
		var radialGradientIn = svg_princ.append("svg:defs")
			.append("radialGradient")
			.attr("id", "radial-gradient-in");

		radialGradientIn.append("svg:stop")
			.attr("offset", "0%")
			.attr("stop-color", "#fff");

		radialGradientIn.append("svg:stop")
			.attr("offset", "100%")
			.attr("stop-color", "orange");

	  
		// le añadimos un grupo svg y lo desplazamos offsetx y offset y
		grupoReloj = svg_princ.append("svg:g")
			.attr("transform", "translate(" + offSetX + "," + offSetY + ")");

		// Le añadimos un rectángulo superior-izd al grupo
		grupoReloj.append("svg:rect")
			.attr("x", -radio)
			.attr("y", -radio)
			.attr("width", radio)
			.attr("height", radio)
			.attr("fill", "#222")
			.attr("stroke", "none");
		
		// Le añadimos un rectángulo inferior-der al grupo
		grupoReloj.append("svg:rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", radio)
			.attr("height", radio)
			.attr("fill", "#222")
			.attr("stroke", "none");


		// Le añadimos el círculo exterior al grupo
		grupoReloj.append("svg:circle")
			.attr("r", radio - (Math.floor(grosor / 2)))
			.attr("fill", "url(#radial-gradient-in)")
			.attr("class", "clock outercircle")
			.attr("stroke", "#222")
			.attr("stroke-width", grosor);

		// Le añadimos el círculo interior al grupo
		grupoReloj.append("svg:circle")
			.attr("r", 4)
			.attr("fill", "black")
			.attr("class", "clock innercircle");

		// Arcos-líneas de las marcas de minutos
		arcoTics = d3.svg.arc()
			.innerRadius(
				function(d) {
					if (d % 5 === 0) 
						return radioMedio - 2;
					else 
						return radioMedio - 1;
				}
			)
			.outerRadius(
				function(d) {
					if (d % 5 === 0) 
						return radioMedio + 2;
					else 
						return radioMedio + 1;
				}
			)
		.startAngle(
			function(d) {
				return escalaSegsMins(d);
			})
		.endAngle(
			function(d) {
				return escalaSegsMins(d);
			});

		// vamos a hacerlo con líneas
		grupoTicksMinutos=svg_princ.append("svg:g")
			.attr("transform", "translate(" + offSetX + "," + offSetY + ")");
		grupoTicksMinutos.selectAll("minsTick")
			.data(d3.range(60))
			.enter()
			.append("svg:path")
			.attr("d", 
				function(d) {
					return arcoTics(d);
				})
			.attr("class", "minsTick")
			.attr("stroke", "black")
			.attr("stroke-width", 
				function(d) {
					if (d % 5 === 0)
						return 2;
					else 
						return 1;
				})
			.attr("stroke", "orange")
			.attr("fill", "none");
	}

	// Creamos la función que nos irá dibujando las manecillas del reloj
	// Esta función se ejecuta cada segundo, gracias al timer que creamos
	// al final del código
	function dibujaManecillas(data) {
	  	var arcoMinutos, arcoSegundos;

		// Lo primero que hacemos es quitar las tres manecillas
		// ya que vamos a volver a dibujarlas
		grupoReloj.selectAll(".clockhand").remove();
    
		// Creamos 3 arco para dibujar las manecillas del reloj.
		// Como los arcos tienen el mismo ángulo inicial y final, 
		// dibujarán una línea en vez de un arco.
		// Para calcular la posición de las manecillas, es decir,
		// dicho "angulo", mapeamos los f_valores de segundos, minutos y horas a 
		// radianes, gracias a las funciones scale**** que habíamos
		// creado con anterioridad

		// Arco-línea de segundos
		arcoSegundos = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(radio * 0.7)
			.startAngle(
				function(d) {
					return escalaSegsMins(d.valor);
				})
			.endAngle(
				function(d) {
					return escalaSegsMins(d.valor);
				});
    
		// Arco-línea de minutos
		arcoMinutos = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(radio * 0.7)
			.startAngle(
				function(d) {
					return escalaSegsMins(d.valor);
				})
			.endAngle(
				function(d) {
					return escalaSegsMins(d.valor);
				});

    
		// Realmente es aquí donce se crean los 3 círculos svg
		// mediante Daja joins.
		// Básicamente lo que hace es lo siguiente:
		// Tenemos 3 objetos en la variable data(seconds, minutes, hours) 
		// que es el parámetro de la función.
		// Y para cada uno de estos objetos, queremos crear su objeto SVG 
		// correspondiente. 
		// Para ello los unimos llamando a la función data(), seguida de enter().
		// En este momento procedemos a construir las manecillas mediante
		// las funciones arc que hemos creado en el paso anterior.
		// Tamien le asignamos la clase "clockhand", lo pintamos de negro y 
		// según sea el dato le asignamos un acho de trazado u otro.
		grupoReloj.selectAll(".clockhand")
			.data(data)
			.enter()
			.append("svg:path")
			.attr("d", 
				function(d) {
					if (d.unidad === "seconds") {
						return arcoSegundos(d);
					} else if (d.unidad === "minutes") {
						return arcoMinutos(d);
					}
				})
			.attr("class", "clockhand")
			.attr("stroke", 
				function(d) {
					if (d.unidad === "seconds")
						return "red";
					else
						return "black"
				})
			.attr("stroke-width", 
				function(d) {
					if (d.unidad === "seconds") {
						return 2;
					} else if (d.unidad === "minutes") {
						return 3;
					} 
				})
			.attr("fill", "none");

	}

	//////////////////////////////////////////////////////////////
	// Funciones para la gestión de la lista de paradas
	//////////////////////////////////////////////////////////////

	function colocaElemento(result) {
		var htmllista = $([
			"<a href='#'>",
			"<span class='li_mins'>" + result.strmins + "</span>",
			":<span class='li_secs'>" + result.strsecs + "</span>",
			"<span class='li_cent'>" + result.strcent + "</span>",
			"</a>"
			].join(""));

		$('<li />', {html: htmllista}).appendTo('ul.lista-tiempos');

		contador++;
		muestraContParadas(contador);
	}

	function cargaLista() {
		localStorageADatos();
		contador = 0;
		var ultTime;
		if (arrParadas) {
			$.each(arrParadas, function(index, value) {
				colocaElemento(formateaf_valores(value));
				ultTime = value;
			});
		}
		if (ultTime) {
			dibujaManecillas(ultTime);
			milesimas = f_milesimas(ultTime);
		} else 
			dibujaManecillas(f_valores(0));
	}

	function eliminaLista() {
		arrParadas = [];
		localStorage.removeItem("paradas");
		contador = 0;
		muestraContParadas(contador);
		$('ul.lista-tiempos').html("");
	}

	function creaElemento(milesimas) {
		var result = formateaTiempo(milesimas);

		// lo guardamos en el array y en localStorage
		arrParadas.push(f_valores(milesimas));
		datosALocalStorage();
		colocaElemento(result);
	}

	//////////////////////////////////////////////////////////
	// Inicio del código
	//////////////////////////////////////////////////////////

	function cambiaBtnSonido() {
	    $('#btnsonido').find('i')
	    .toggleClass('glyphicon glyphicon-volume-off')
	    .toggleClass('glyphicon glyphicon-volume-up')
	    .toggleClass('colorwhite')
	    .toggleClass('colorblack');
	}

	$("#btnsonido").on("click", function(event) {
	    $(this).find('i')
	    .toggleClass('glyphicon glyphicon-volume-off')
	    .toggleClass('glyphicon glyphicon-volume-up')
	    .toggleClass('colorwhite')
	    .toggleClass('colorblack');
		sonando = !sonando;
		datosALocalStorage();
	});


	dibujaReloj()
	inicializar();
	if (!sonando)
		cambiaBtnSonido();

	/////////////////////////////////////////////////////////
	// Funciones de gestión del cronómetro
	/////////////////////////////////////////////////////////

	function mostrar()  { 
		milesimas += 10;
		parcial += 10;
		if (parcial >= 1000) {
			parcial = 0;
		}
		if (milesimas % 10 === 0) {
			muestraHora(milesimas);
		}
		// Cada segundo
		if (milesimas % 1000 === 0) {
			var segundos = milesimas / 1000;
			sonando = true;
			if (segundos > 0 && sonando) {
				audiotick.muted = false;
				audiotick.play();
			}
		  	var data;
  			data = f_valores(milesimas);
  			return dibujaManecillas(data);
		}
	}
	
	function arrancar() { 
		if (!estactil) {
			$("#cambiar").html("STOP");
			$("#inicializar").prop("disabled", true);
		}
		t=setInterval(mostrar, 10);
	}

	function parar() { 
		if (!estactil) {
			$("#cambiar").html("START");
			$("#inicializar").prop("disabled", false);
		}
		creaElemento(milesimas);
		clearInterval(t);  
		t=undefined; 
	}
	
	function cambiar()  { 
		if (!t) 
			arrancar(); 
		else 
			parar(); 
	}

	// Aquí detectamos si la pantalla es táctil o no y
	// según lo sea o no, configuramos la interfaz para que 
	// tenga botonos o no, y responda a unos eventos u otros

	if ("ontouchstart" in document.documentElement){
		// pantalla táctil
		estactil = true;
		$('#cambiar').hide();
		$('#inicializar').hide();
		$("#principal").on("tap", function(e) {
			if (!t && sonando) {
				// No está contando y el sonido está activado
				// Hacemos un tick mudo, para que no nos de el error 
				// "play() can only be initiated by a user gesture"
				audiotick.muted = true;
				audiotick.play();
			}
			cambiar();
		});
		$("#principal").on("swipeRight", function(e) {
			if (!t) {
				eliminaLista();
				inicializar();
			}
		});
	} else {
		// pantalla no táctic; mostramos y activamos los botones;
		estactil = false;
		$('#cambiar').show();
		$('#inicializar').show();
		$('#cambiar').on('click', cambiar);
		$('#inicializar').on('click', function() { 
			if (!t) {
				eliminaLista();
				inicializar();
			}
		});
	}



});
