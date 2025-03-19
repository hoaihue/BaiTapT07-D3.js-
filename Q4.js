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
        "Thời gian tạo đơn": new Date(d["Thời gian tạo đơn"]),
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));

    const getWeekday = (date) => {
        const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        return weekdays[date.getDay()];
    };

    const dayData = data1.map(d => ({
        "Ngày tạo đơn": d["Thời gian tạo đơn"].toISOString().split('T')[0],
        "Thứ": getWeekday(d["Thời gian tạo đơn"]),
        "Thành tiền": d["Thành tiền"],
        "SL": d["SL"]
    }));

    const aggregatedData = dayData.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Thứ"] === item["Thứ"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
            existingItem["Ngày tạo đơn"].push(item["Ngày tạo đơn"]);
        } else {
            acc.push({
                "Thứ": item["Thứ"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"],
                "Ngày tạo đơn": [item["Ngày tạo đơn"]]
            });
        }
        return acc;
    }, []);

    aggregatedData.forEach(d => {
        const uniqueDays = [...new Set(d["Ngày tạo đơn"])].length;
        d["Doanh số bán TB"] = d["Thành tiền"] / uniqueDays;
        d["Số lượng bán TB"] = d["SL"] / uniqueDays;
    });

    const weekdaysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
    aggregatedData.sort((a, b) => weekdaysOrder.indexOf(a["Thứ"]) - weekdaysOrder.indexOf(b["Thứ"]));

    const svg = d3.select("#Q4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Thứ"]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 15_000_000])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const bars = chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Thứ"]))
        .attr("y", d => y(d["Doanh số bán TB"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán TB"]))
        .attr("fill", d => colorScale(d["Thứ"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Ngày ${d["Thứ"]}</strong></p>
                <p><strong>Doanh số bán TB:</strong> ${Math.ceil(d["Doanh số bán TB"]).toLocaleString()} VND</p>
                <p><strong>Số lượng bán TB:</strong> ${Math.ceil(d["Số lượng bán TB"]).toLocaleString()} SKUs</p>
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

    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Thứ"]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán TB"]) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${Math.ceil(d["Doanh số bán TB"]).toLocaleString()} VND`)
        .style("font-size", "11px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`)
            .ticks(15)
        )
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
