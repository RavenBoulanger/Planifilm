// Carré de sable JavaScript
window.onload = function () {

	// -----INITIALISATION-----

	var vueDetails = false;
	// Les dimensions du graphique
	//			var width = 350,
	var width = $(window).width(),
		//				height = 500,
		height = $(window).height() - d3.select("footer.main_footer").attr("height"),
		//				maxRadius = 90;
		maxRadius = Math.sqrt(width * height / 24),
		bulleZoom = 1.35,
		bullePadding = maxRadius * 0.05;


	// set the radius range
	var r = d3.scaleLinear()
		.range([0, maxRadius]);

	// couleurs TEMP
	var color = d3.scaleOrdinal(d3.schemeCategory10);


	// append the figure object to the body of the page
	// append a 'section' element to 'figure'
	// Ajouter le parent du graphique tout de suite pour que la mise en page des boites soit déjà prête
	var chart = d3.select("#data-figure").append("figure").attr("class", ".svgbulle")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var chartImg = chart.append("g").attr("class", "image");
	var chartHit = chart.append("g").attr("class", "hit");


	var details = d3.select("#data-figure figure")
		.append("section")
		.attr("class", "bulle-details");


	// fonctions utilitaires
	// https://github.com/wbkd/d3-extended
	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};
	d3.selection.prototype.moveToBack = function () {
		return this.each(function () {
			var firstChild = this.parentNode.firstChild;
			if (firstChild) {
				this.parentNode.insertBefore(this, firstChild);
			}
		});
	};

	// -----LOADER LES DONNÉES (asynchrone)-----
	d3.json("data/films.json", function (error, data) {

		if (error) {
			throw error;
		} else {
			//			console.log(data);
			createNodes(data);
		}

	});

	// Variables pour créer la visualisation
	var bulles;
	var nodes;
	var simulation;

	// Créer les nodes
	function createNodes(data) {

		// initialization des variables pour la simulation
		var forceStrength = 0.0002;
		var gravity = 01;

		// Typer la colonne priorite en nombre
		// (par défaut toutes les données sont des chaînes de caractères)
		data.forEach(function (d) {
			// assurer que c'est un nombre
			d.priorite = +d.priorite;
		});

		// Mettre la donnée à l'échelle du graphique
		r.domain([0, d3.max(data, function (d) {
			return d.priorite;
		})]);

		//
		simulation = d3.forceSimulation()
			.velocityDecay(0.04)
			//        .force('x', d3.forceX().strength(forceStrength).x(center))
			.force("y", d3.forceY().strength(forceStrength).y(gravity))
			.force("collide", d3.forceCollide().radius(function (d) {
				return d.radius + bullePadding;
			}).iterations(2))
			.alphaDecay(0.001)
			.alphaTarget(0.001)
			// appelle la fonction pour animer à chaque "tick"
			.on("tick", ticked);

		// La simulation est en marche par défaut. Il faut l'arrêter jusqu'à ce qu'on aie crée les formes
		simulation.stop();

		nodes = data.map(function (d) {
			var myRadius = r(d.priorite);
			return {
				id: d.id,
				titre: d.titre,
				priorite: d.priorite,
				tags: d.tags,
				radius: myRadius,
				x: myRadius + (Math.random() * (width - myRadius * 2)),
				y: height
					//						y: myRadius + (Math.random() * (height - myRadius * 2))
			};
		});

		drawChart(nodes);
		drawHitbox(nodes);

	}


	// -----FONCTION POUR CRÉER LA VISUALISATION-----
	function drawChart(data) {

		// créer la variable pour les formes
		// 1. selectionner le contenant
		bulles = chartImg
			// 2. Définir le "data join" (définir le type d'élément auquel on va attacher les données)
			.selectAll("g")
			// 3. Créer le "data join"
			.data(nodes, function (d) {
				return d.id;
			});

		//
		// AJOUTER LES BULLES À LA VISUALISATION
		// créer une variable temporaire
		var bullesTemp = bulles.enter().append("g").attr("class", "bulle");

		// bulle/sprite
		var imageBulle = bullesTemp
			//					.append("g").attr("class", "bulleImg")
			.append("image")
			.attr("xlink:href", "img/bulle.svg")
			.attr("width", 0).attr("height", 0)
			.attr("x", function (d) {
				d.x;
			}).attr("y", function (d) {
				d.y;
			});


		// assigner la variable temporaire à bulles
		bulles = bulles.merge(bullesTemp);

		// grossir les images
		d3.selectAll(".bulle").select("image").transition()
			.duration(1500)
			.attr("width", function (d) {
				//				console.log("d.radius");
				return d.radius * bulleZoom * 2;
			})
			.attr("height", function (d) {
				return d.radius * bulleZoom * 2;
			})
			.attr("transform", function (d) {

				var center = [-d.radius * bulleZoom, -d.radius * bulleZoom];
				return "translate(" + center + ")";
			});

		//partir la simulation
		simulation.nodes(nodes)
			.restart();

	}


	function drawHitbox(data) {

		//		console.log("hit");


		// créer la variable pour les formes
		// 1. selectionner le contenant
		bulles = chartHit
			// 2. Définir le "data join" (définir le type d'élément auquel on va attacher les données)
			.selectAll("g")
			// 3. Créer le "data join"
			.data(nodes, function (d) {
				return d.id;
			});

		//
		// AJOUTER LES BULLES À LA VISUALISATION
		// créer une variable temporaire
		var bullesTemp = bulles.enter().append("g").attr("class", "bulle");

		// hitzone
		var cercleBulle = bullesTemp
			//					.append("g").attr("class", "bulleHit")
			.append("circle")
			//					.attr("stroke", "white")
			.attr("fill", "transparent")
			.attr("class", "hitzone")
			.attr("r", 0)
			.attr("cx", function (d) {
				d.x;
			}).attr("cy", function (d) {
				d.y;
			});
		cercleBulle.on("click", function (d, i) {
			//			console.log(i);

			// le mode vueDetails agrandit la bulle et affiche les détails
			basculeDetails(d.id, d);

		});


		// assigner la variable temporaire à bulles
		bulles = bulles.merge(bullesTemp);


		d3.selectAll(".bulle").select("circle").transition()
			.duration(1500)
			.attr("r", function (d) {
				return d.radius;
			});

		//partir la simulation
		simulation.nodes(nodes)
			.restart();
	}


	function basculeDetails(maBulle, d) {
		// bascule mode détails
		vueDetails = !vueDetails;
		// si off
		if (vueDetails) {

			var newSize = Math.max(width, height) * 1.5;

			//					console.log(d3.select(".image").selectAll(".bulle").filter(function (d, i) {
			//						return d.id === maBulle;
			//					}).select("image"));

			// maximise bulle
			d3.select(".image").selectAll(".bulle").filter(function (d, i) {
					return d.id === maBulle;
				}).select("image")
				.transition()
				.duration(1500)
				.attr("width", newSize * bulleZoom * 2)
				.attr("height", newSize * bulleZoom * 2) //newSize * bulleZoom * 2
				.attr("transform", function () {

					var center = [-newSize * bulleZoom, -newSize * bulleZoom];
					return "translate(" + center + ")";
				});

			// redimensionner le hitzone
			d3.select(".hit").selectAll(".bulle").filter(function (d, i) {
					return d.id === maBulle;
				}).select("circle")
				.transition()
				.duration(1500)
				.attr("r", newSize);

			// déplacer les formes par dessus le reste
			d3.select(".hit").selectAll(".bulle").filter(function (d, i) {
				return d.id === maBulle;
			}).moveToFront();
			d3.select(".image").selectAll(".bulle").filter(function (d, i) {
				return d.id === maBulle;
			}).moveToFront();

			// affiche info
			setTimeout(function () {
				details.html("<div class='info'>" + "<h3>" + d.titre + "</h3>" + "<p>Tags: " + d.tags + "</p>" + "</div>");
				//				console.log(d.id + " " + d.titre + " " + d.priorite);
			}, 800);

		} else
		// si on
		{
			// rapetisse bulle
			d3.select(".image").selectAll(".bulle").filter(function (d, i) {
					return d.id === maBulle;
				}).select("image")
				.transition()
				.duration(1000)
				.attr("width", function (d) {
					return d.radius * bulleZoom * 2;
				})
				.attr("height", function (d) {
					return d.radius * bulleZoom * 2;
				}) //newSize * bulleZoom * 2
				.attr("transform", function (d) {

					var center = [-d.radius * bulleZoom, -d.radius * bulleZoom];
					return "translate(" + center + ")";
				});

			// rapetisse hit
			d3.select(".hit").selectAll(".bulle").filter(function (d, i) {
					return d.id === maBulle;
				}).select("circle")
				.transition()
				.duration(1000)
				.attr("r", function (d) {
					return d.radius;
				});

			// enlève info
			details.html("&nbsp;");
		}
	}


	/*----------------
	// Fonction pour redimensionner des bulles
	function resizeBulles (selectBulles, newSize, duration) {
	            console.log(d3.selectAll(selectBulles).select("image").attr("width"));

	  // redimensionner la bulle/sprite
	  selectBulles.select("image").transition()
	    .duration(duration)
	    .attr("width", newSize * bulleZoom * 2)
	    .attr("height", newSize * bulleZoom * 2)
	    .attr("transform", "translate(" + -newSize * bulleZoom + ", ", -newSize * bulleZoom + ")");

	  // redimensionner le hitzone
	  selectBulles.select("circle").transition()
	    .duration(duration)
	    .attr("r", newSize);


	  d3.selectAll(".bulle").select("image").transition()
	    .duration(1500)
	    .attr("width", function(d) {
	      console.log("d.radius");
	      return d.radius * bulleZoom * 2;
	    })
	    .attr("height", function(d) {
	      return d.radius * bulleZoom * 2;
	    })
	    .attr("transform", function (d) {

	      var center = [-d.radius * bulleZoom, -d.radius * bulleZoom];
	      return "translate(" + center + ")";
	    })
	  ;

	}*/

	// fonction qui fait l'animation
	function ticked() {
		var headerheight = 60;
		var footerheight = 60;
		//				console.log("aaa");
		chartImg.selectAll("image")
			.attr('x', function (d) {

				var myRadius = r(d.priorite) * 1.1 + bullePadding;
				return d.x = Math.max(myRadius, Math.min(width - myRadius, d.x));
			})
			.attr('y', function (d) {

				var myRadius = r(d.priorite) * 1.1 + bullePadding;
				return d.y = Math.max(myRadius + headerheight, Math.min(height - myRadius - footerheight, d.y));
			});


		chartHit.selectAll("circle")
			.attr('cx', function (d) {

				var myRadius = r(d.priorite) * 1.1 + bullePadding;
				return d.x = Math.max(myRadius, Math.min(width - myRadius, d.x));
			})
			.attr('cy', function (d) {

				var myRadius = r(d.priorite) * 1.1 + bullePadding;
				return d.y = Math.max(myRadius + headerheight, Math.min(height - myRadius - footerheight, d.y));
			});
	}


	// fonction pour filtrer les bulles
	d3.selectAll(".filter").on("click", function () {
		var myButton = d3.select(this);

		var selected = myButton.attr("id");

		//		console.log(selected);

		// if mine is active
		if (selected == "all" || $("#" + selected).hasClass("active")) {

			// deselect all
			$(".active").removeClass("active").addClass("inactive");
			// show all
			chart.selectAll(".bulle")
				.attr("display", "inline");
			// activate All
			$("#all").removeClass("inactive").addClass("active");
			//					myButton.attr("class", "inactive");
			//					console.log("inactive");

		} else // if mine is inactive
		{

			// deselect all
			$(".active").removeClass("active").addClass("inactive");
			// make mine active
			$("#" + selected).removeClass("inactive").addClass("active");
			// hide all
			chart.selectAll(".bulle")
				.attr("display", "none")
				// show mine
				.filter(function (d) {
					return d.tags.match(new RegExp(selected));
				})
				.attr("display", "inline");
		}

	});

}

