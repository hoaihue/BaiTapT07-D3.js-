document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const margin = { top: 40, right: 40, bottom: 50, left: 200 },
        width = 900,
        height = 500;

    const data1 = window.data.map(d => ({
        "Mã đơn hàng": d["Mã đơn hàng"],
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));

    const totalOrders = [...new Set(data1.map(d => d["Mã đơn hàng"]))].length;
    const aggregatedData = data1.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Nhóm hàng"] === item["Nhóm hàng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
            existingItem["Mã đơn hàng"].push(item["Mã đơn hàng"]);
        } else {
            acc.push({
                "Nhóm hàng": item["Nhóm hàng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"],
                "Mã đơn hàng": [item["Mã đơn hàng"]]
            });
        }
        return acc;
    }, []);

    aggregatedData.forEach(d => {
        const uniqueOrders = [...new Set(d["Mã đơn hàng"])].length;
        d["Xác suất bán"] = (uniqueOrders / totalOrders) * 100;
        d["SL Đơn Bán"] = uniqueOrders;
    });

    aggregatedData.sort((a, b) => b["Xác suất bán"] - a["Xác suất bán"]);

    const svg = d3.select("#Q7")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, 60])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Nhóm hàng"]).reverse())
        .range([height, 0])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const bars = chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Nhóm hàng"]))
        .attr("width", d => x(d["Xác suất bán"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
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
        .on("click", function () {
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
        .attr("x", d => x(d["Xác suất bán"]) + 5)
        .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => `${d["Xác suất bán"].toFixed(1)}%`)
        .style("font-size", "10px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${d}%`)
            .ticks(6))
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y))
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