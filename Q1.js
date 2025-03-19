document.addEventListener("DOMContentLoaded", function () {
    
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    console.log("Dữ liệu đã load:", window.data);


   
    const margin = { top: 40, right: 200, bottom: 50, left: 250 }, 
        width = 700,
        height = 400;


 
    const data1 = window.data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));



    const aggregatedData = data1.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Mặt hàng"] === item["Mặt hàng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
        } else {
            acc.push({
                "Mặt hàng": item["Mặt hàng"],
                "Nhóm hàng": item["Nhóm hàng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"]
            });
        }
        return acc;
    }, []);



    aggregatedData.sort((a, b) => b["Thành tiền"] - a["Thành tiền"]);



    const svg = d3.select("#Q1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);



    const x = d3.scaleLinear()
        .domain([0, 700_000_000])
        .range([0, width]);


    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Mặt hàng"]))
        .range([0, height])
        .padding(0.2);


  
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


  
    const bars = chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Mặt hàng"]))
        .attr("width", d => x(d["Thành tiền"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>Mặt hàng:</strong> ${d["Mặt hàng"]}<br>
                <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                <strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VND<br>
                <strong>Số lượng bán:</strong> ${d["SL"]} SKUs
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function (d) {

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {

            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3); 
                d3.select(this).attr("opacity", 1); 
            } else {
      
                bars.attr("opacity", 1); 
            }
        });


  
    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Thành tiền"]) + 5) 
        .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`) 
        .style("font-size", "11px");


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`) 
            .ticks(7) 
        )
        .style("font-size", "11px");



    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text") 
        .style("font-size", "11px")
        .style("text-anchor", "end");


 
    const filter = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 30},${margin.top})`);


    const filterRects = filter.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale)
        .on("click", function (event, selectedGroup) {
            
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3); 
                bars.filter(d => d["Nhóm hàng"] === selectedGroup).attr("opacity", 1); 
            } else {
                
                bars.attr("opacity", 1); 
            }
        });


    filter.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .text(d => d)
        .style("font-size", "11px");


    
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");
});

