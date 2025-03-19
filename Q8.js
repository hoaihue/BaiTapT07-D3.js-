document.addEventListener("DOMContentLoaded", function () {
 
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    console.log("Dữ liệu đã load:", window.data);



    const margin = { top: 40, right: 200, bottom: 100, left: 200 },
        width = 900,
        height = 400;


   
    const data1 = window.data.map(d => ({
        "Mã đơn hàng": d["Mã đơn hàng"],
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0,
        "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).toLocaleString('default', { month: '2-digit' })}` 
    }));



    const totalOrdersByMonth = data1.reduce((acc, item) => {
        const month = item["Tháng tạo đơn"];
        if (!acc[month]) {
            acc[month] = new Set();
        }
        acc[month].add(item["Mã đơn hàng"]);
        return acc;
    }, {});


    const aggregatedData = data1.reduce((acc, item) => {
        const month = item["Tháng tạo đơn"];
        const group = item["Nhóm hàng"];
        const key = `${month}|${group}`;


        if (!acc[key]) {
            acc[key] = {
                "Tháng": month,
                "Nhóm hàng": group,
                "Mã đơn hàng": new Set(),
                "SL": 0
            };
        }
        acc[key]["Mã đơn hàng"].add(item["Mã đơn hàng"]);
        acc[key]["SL"] += item["SL"];
        return acc;
    }, {});


    const finalData = Object.values(aggregatedData).map(d => {
        const uniqueOrders = d["Mã đơn hàng"].size;
        const totalOrders = totalOrdersByMonth[d["Tháng"]].size;
        d["Xác suất bán"] = (uniqueOrders / totalOrders) * 100;
        d["SL Đơn Bán"] = uniqueOrders;
        return d;
    });


 
    const svg = d3.select("#Q8")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


   
    const x = d3.scaleBand()
        .domain(["Tháng 01", "Tháng 02", "Tháng 03", "Tháng 04", "Tháng 05", "Tháng 06", "Tháng 07", "Tháng 08", "Tháng 09", "Tháng 10", "Tháng 11", "Tháng 12"])
        .range([0, width])
        .padding(0.1);


    const y = d3.scaleLinear()
        .domain([20, 70]) 
        .range([height, 0]);


    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    
    const groupedData = d3.groups(finalData, d => d["Nhóm hàng"]);


    
    const line = d3.line()
        .x(d => x(d["Tháng"]) + x.bandwidth() / 2)
        .y(d => y(d["Xác suất bán"]));


    const lines = chart.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d[1]))
        .attr("stroke", d => colorScale(d[0]))
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Nhóm hàng: ${d[0]}</strong></p>
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
            
            const isActive = d3.select(this).attr("stroke-width") === "4";
            
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
            } else {
                
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                d3.select(this).attr("stroke-width", 4).attr("opacity", 1);
                markers.filter(m => m["Nhóm hàng"] === d[0]).attr("r", 6).attr("opacity", 1);
            }
        });


    
    const markers = chart.selectAll(".marker")
        .data(finalData)
        .enter()
        .append("circle")
        .attr("class", "marker")
        .attr("cx", d => x(d["Tháng"]) + x.bandwidth() / 2)
        .attr("cy", d => y(d["Xác suất bán"]))
        .attr("r", 4)
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>${d["Tháng"]}</strong></p>
                <p><strong>Nhóm hàng: ${d["Nhóm hàng"]}</strong></p>
                <p><strong>SL Đơn Bán:</strong> ${d["SL Đơn Bán"].toLocaleString()}</p>
                <p><strong>Xác suất Bán:</strong> ${d["Xác suất bán"].toFixed(1)}%</p>
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
            
            const isActive = d3.select(this).attr("r") === "6";
            
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
            } else {
                
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                d3.select(this).attr("r", 6).attr("opacity", 1);
                lines.filter(l => l[0] === d["Nhóm hàng"]).attr("stroke-width", 4).attr("opacity", 1);
            }
        });


    
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");


    
    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${d}%`) 
            .ticks(10) 
        )
        .style("font-size", "11px");


    
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
            
            const isActive = d3.select(this).attr("opacity") === "0.3";
            
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
                filterRects.attr("opacity", 1); 
            } else {
                
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                lines.filter(l => l[0] === selectedGroup).attr("stroke-width", 4).attr("opacity", 1);
                markers.filter(m => m["Nhóm hàng"] === selectedGroup).attr("r", 6).attr("opacity", 1);
                filterRects.attr("opacity", 0.3); 
                d3.select(this).attr("opacity", 1);
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

