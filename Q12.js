document.addEventListener("DOMContentLoaded", function () {
    
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    console.log("Dữ liệu đã load:", window.data);


    
    const margin = { top: 40, right: 40, bottom: 100, left: 200 }, 
        width = 900,
        height = 400;


    
    const data1 = window.data.map(d => ({
        "Mã khách hàng": d["Mã khách hàng"],
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0
    }));


    
    const customerSpending = Array.from(
        d3.rollup(data1,
            v => d3.sum(v, d => d["Thành tiền"]), 
            d => d["Mã khách hàng"]
        ),
        ([key, value]) => ({ "Mã khách hàng": key, "Chi tiêu KH": value })
    );


    
    const binSize = 50000;
    const binnedData = Array.from(
        d3.rollup(customerSpending,
            v => v.length, 
            d => Math.floor(d["Chi tiêu KH"] / binSize) * binSize
        ),
        ([key, value]) => ({
            "Khoảng chi tiêu": `Từ ${key} đến ${key + binSize}`,
            "Số lượng KH": value,
            "Chi tiêu KH": key 
        })
    );


    
    binnedData.sort((a, b) => a["Chi tiêu KH"] - b["Chi tiêu KH"]);


    
    const svg = d3.select("#Q12")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    
    const x = d3.scaleBand()
        .domain(binnedData.map(d => `${d["Chi tiêu KH"] / 1000}K`)) 
        .range([0, width])
        .padding(0.2);


    const y = d3.scaleLinear()
        .domain([0, 1600]) 
        .range([height, 0]);


    
    const bars = chart.selectAll(".bar")
        .data(binnedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(`${d["Chi tiêu KH"] / 1000}K`))
        .attr("y", d => y(d["Số lượng KH"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Số lượng KH"]))
        .attr("fill", "steelblue") 
        .on("mouseover", function (event, d) {
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Đã chi tiêu ${d["Khoảng chi tiêu"]}</strong></p>
                <p><strong>Số lượng KH:</strong> ${d["Số lượng KH"].toLocaleString()}</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            
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


    
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px")
        .selectAll("text") 
        .style("text-anchor", "end")
        .attr("dx", "-0.8em") 
        .attr("dy", "0.15em") 
        .attr("transform", "rotate(-90)") 
        .text((d, i) => (i % 2 === 0 ? `${binnedData[i]["Chi tiêu KH"] / 1000 + 50}K` : "")); 


    
    chart.append("g")
        .call(d3.axisLeft(y).ticks(16)) 
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

