(() => {    
    const width = 500, height = 300, margin = { top: 40, right: 100, bottom: 50, left: 100 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(data) || data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", data);

        const data_processed = data.map(d => ({
            "Tháng": `T ${d["Thời gian tạo đơn"].split("-")[1]}`,
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
            "Mã đơn hàng": d["Mã đơn hàng"]
        }));

        const totalOrdersByGroupMonth = {};
        const itemOrdersByGroupMonth = {};

        data_processed.forEach(({ "Nhóm hàng": group, "Mặt hàng": item, "Tháng": month, "Mã đơn hàng": orderID }) => {
            if (!totalOrdersByGroupMonth[group]) totalOrdersByGroupMonth[group] = {};
            if (!totalOrdersByGroupMonth[group][month]) totalOrdersByGroupMonth[group][month] = new Set();
            totalOrdersByGroupMonth[group][month].add(orderID);

            const key = `${group}|||${item}|||${month}`;
            if (!itemOrdersByGroupMonth[key]) itemOrdersByGroupMonth[key] = new Set();
            itemOrdersByGroupMonth[key].add(orderID);
        });

        const probabilityData = {};
        Object.keys(itemOrdersByGroupMonth).forEach(key => {
            const [group, item, month] = key.split("|||");

            if (!probabilityData[group]) probabilityData[group] = [];
            probabilityData[group].push({
                "Tháng": month,
                "Mặt hàng": item,
                "Nhóm hàng": group,
                "Xác suất": itemOrdersByGroupMonth[key].size / totalOrdersByGroupMonth[group][month].size
            });
        });

        Object.values(probabilityData).forEach(data => {
            data.sort((a, b) => parseInt(a["Tháng"].split(" ")[1]) - parseInt(b["Tháng"].split(" ")[1]));
        });

        const chartContainer = d3.select("#Q10");
        chartContainer.html("");

        chartContainer.style("display", "grid")
            .style("grid-template-columns", "repeat(3, 1fr)")
            .style("gap", "10px")
            .style("justify-content", "center");

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "8px")
            .style("pointer-events", "none")
             .style("text-align", "left");

        Object.entries(probabilityData).forEach(([group, data]) => {
            const div = chartContainer.append("div")
                .style("display", "inline-block")
                .style("margin", "10px")
                .style("vertical-align", "top");

            div.append("h3").text(group).style("text-align", "center").style("font-size", "14px");

            const svg = div.append("svg")
                .attr("width", width)
                .attr("height", height);

            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scalePoint()
                .domain([...new Set(data.map(d => d["Tháng"]))])
                .range([0, width - margin.left - margin.right])
                .padding(0.5);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d["Xác suất"])]).nice()
                .range([height - margin.top - margin.bottom, 0]);

            chart.append("g")
                .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
                .call(d3.axisBottom(x))
                .style("font-size", "10px");

            chart.append("g")
                .call(d3.axisLeft(y).tickFormat(d3.format(".0%")).ticks(5))
                .style("font-size", "10px");

            const items = [...new Set(data.map(d => d["Mặt hàng"]))];
            const color = d3.scaleOrdinal(d3.schemeTableau10);

            const lines = chart.selectAll(".line-group")
                .data(items)
                .enter()
                .append("g")
                .attr("class", "line-group");

            lines.each(function(item) {
                const itemData = data.filter(d => d["Mặt hàng"] === item);
                const line = d3.line()
                    .x(d => x(d["Tháng"]))
                    .y(d => y(d["Xác suất"]));

                d3.select(this).append("path")
                    .datum(itemData)
                    .attr("fill", "none")
                    .attr("stroke", color(item))
                    .attr("stroke-width", 2)
                    .attr("class", "line")
                    .attr("d", line)
                    .on("click", function() {
                        const isActive = d3.select(this).classed("active");
                        d3.selectAll(".line").style("opacity", isActive ? 1 : 0.3);
                        d3.select(this).style("opacity", 1).classed("active", !isActive);
                    });
            });

            chart.selectAll(".dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => x(d["Tháng"]))
                .attr("cy", d => y(d["Xác suất"]))
                .attr("r", 4)
                .attr("fill", d => color(d["Mặt hàng"]))
                .on("mouseover", function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`
                        <strong>Tháng:</strong> ${d["Tháng"]} <br>
                        <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]} <br>
                        <strong>Mặt hàng:</strong> ${d["Mặt hàng"]} <br>
                        <strong>Xác suất bán:</strong> ${(d["Xác suất"] * 100).toFixed(2)}%
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseleave", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            const legend = div.append("div")
                .style("text-align", "center")
                .style("display", "flex")
                .style("flex-wrap", "wrap")
                .style("justify-content", "center")
                .style("max-width", "75%")
                .style("margin", "10px auto");

            items.forEach(item => {
                const legendItem = legend.append("div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("margin", "2px 5px");

                legendItem.append("div")
                    .style("width", "12px")
                    .style("height", "12px")
                    .style("background-color", color(item))
                    .style("margin-right", "5px");

                legendItem.append("span")
                    .style("font-size", "10px")
                    .text(item);
            });
        });
    });
})();

