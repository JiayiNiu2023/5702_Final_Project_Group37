// Load the data
d3.json("d3_data.json").then(function (data) {
    const width = 800;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 50, left: 80 };

    // Append SVG
    const svg = d3.select("#plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create scales with dynamic padding
    const xScale = d3.scaleLinear()
        .domain([
            d3.min(data, (d) => d.Log_Inflation) - 0.5,
            d3.max(data, (d) => d.Log_Inflation) + 0.5,
        ])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(data, (d) => d.Log_Current_Account) - 0.5,
            d3.max(data, (d) => d.Log_Current_Account) + 0.5,
        ])
        .range([height - margin.bottom, margin.top]);

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    // Append axes to SVG
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Signed Log(Inflation Rate + 1)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Signed Log(Current Account Balance + 1)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Inflation Rate vs Current Account Balance by Region");

    // Tooltip setup
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add clip path to restrict drawing outside the plotting area
    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    // Add dropdowns dynamically
    const years = Array.from(new Set(data.map((d) => d.Year))).sort((a, b) => a - b);
    const regions = Array.from(new Set(data.map((d) => d.Region)));

    const controls = d3.select("#plot")
        .append("div")
        .style("margin-bottom", "20px");

    controls
        .append("label")
        .text("Select Year: ")
        .append("select")
        .attr("id", "yearSelect")
        .selectAll("option")
        .data(years)
        .join("option")
        .text((d) => d);

    controls
        .append("label")
        .text("Select Region: ")
        .append("select")
        .attr("id", "regionSelect")
        .selectAll("option")
        .data(["All"].concat(regions))
        .join("option")
        .text((d) => d);

    // Initial Plot
    function update(year, region) {
        let filteredData = data.filter((d) => d.Year == year);
        if (region !== "All") {
            filteredData = filteredData.filter((d) => d.Region == region);
        }

        // Bind data to circles
        const circles = svg.selectAll("circle")
            .data(filteredData, (d) => d.Country);

        // Enter and Update
        circles
            .enter()
            .append("circle")
            .attr("clip-path", "url(#clip)")
            .attr("cx", (d) => xScale(d.Log_Inflation))
            .attr("cy", (d) => yScale(d.Log_Current_Account))
            .attr("r", 5)
            .attr("fill", (d) => d3.schemeCategory10[regions.indexOf(d.Region)])
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(
                        `Country: ${d.Country}<br>Region: ${d.Region}<br>Inflation: ${d.Inflation}<br>Current Account: ${d.Current_Account}`
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .merge(circles)
            .transition()
            .duration(500)
            .attr("cx", (d) => xScale(d.Log_Inflation))
            .attr("cy", (d) => yScale(d.Log_Current_Account))
            .attr("r", 5);

        // Exit
        circles.exit().remove();
    }

    // Default values
    update(years[0], "All");

    // Dropdown change events
    d3.select("#yearSelect").on("change", function () {
        const year = d3.select(this).property("value");
        const region = d3.select("#regionSelect").property("value");
        update(year, region);
    });

    d3.select("#regionSelect").on("change", function () {
        const year = d3.select("#yearSelect").property("value");
        const region = d3.select(this).property("value");
        update(year, region);
    });
});
