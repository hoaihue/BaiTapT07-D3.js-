document.addEventListener("DOMContentLoaded", function () {
    if (!window.data || !window.data.length || !Array.isArray(window.data)) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    const margin = { top: 30, right: 50, bottom: 50, left: 120 }, // bottom:90
        width = 450,// Giảm nhẹ kích thước biểu đồ
        height = 200; // Giữ chiều cao hợp lý




    const data1 = window.data.map(d => ({
        "Mã đơn hàng": d["Mã đơn hàng"],
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0,
        "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).getMonth() + 1}`
    }));


    const tong_nhom = d3.rollup(data1, v => new Set(v.map(d => d["Mã đơn hàng"])).size, d => d["Nhóm hàng"]);
    const df_grouped = d3.rollup(data1, v => new Set(v.map(d => d["Mã đơn hàng"])).size, d => d["Nhóm hàng"], d => d["Mặt hàng"]);


    const df_result = Array.from(df_grouped).flatMap(([group, items]) =>
        Array.from(items).map(([item, count]) => ({
            "Nhóm hàng": group,
            "Mặt hàng": item,
            "don_hang_mat_hang": count,
            "tong_don_theo_nhom": tong_nhom.get(group),
            "Xác suất bán": count / tong_nhom.get(group)
        }))
    );


    df_result.sort((a, b) => b["Xác suất bán"] - a["Xác suất bán"]);


    // Define the SVG container with dynamic width based on the number of charts per row
    const svg = d3.select("#Q9")
        .append("svg")
        .attr("width", (width + margin.left + margin.right) * 3) // First row has 3 charts
        .attr("height", (height + margin.top + margin.bottom) * 2); // Two rows


    // Tạo container dạng grid để xếp mỗi hàng 3 biểu đồ
    const chartContainer = d3.select("#Q9")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, 1fr)")
        .style("gap", "10px");


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const groupedData = d3.groups(df_result, d => d["Nhóm hàng"]);


    // Order groups as shown in the image
    const orderedGroups = ["[BOT] Bột", "[SET] Set trà", "[THO] Trà hoa", "[TMX] Trà mix", "[TTC] Trà củ, quả sấy"];
    const sortedGroupedData = orderedGroups.map(group => groupedData.find(g => g[0] === group)).filter(g => g);


    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");


    // Calculate spacing between charts
    const groupSpacing = (width + margin.right); // Fixed spacing for each chart


    sortedGroupedData.forEach(([group, data], index) => {
        const row = Math.floor(index / 3); // First row: 0-2, Second row: 3-4
        const col = index % 3;


        // Adjust position for the second row to center the two charts
        let xOffset = col * groupSpacing;
        if (row === 1) { // Second row
            xOffset = (col % 2) * groupSpacing + (groupSpacing / 2); // Center the two charts
        }


        const groupChart = chart.append("g")
            .attr("transform", `translate(${xOffset},${row * (height + margin.bottom)})`);


        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Xác suất bán"]) * 1.1]) // Giới hạn chiều dài thanh
            .range([0, width - margin.left - margin.right]);
       


        const y = d3.scaleBand()
            .domain(data.map(d => d["Mặt hàng"]))
            .range([0, height])
            .padding(0.3);


        const bars = groupChart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d["Mặt hàng"]))
            .attr("width", d => x(d["Xác suất bán"]))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d["Mặt hàng"]))
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>Mặt hàng:</strong> ${d["Mặt hàng"]}<br>
                    <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                    <strong>SL Đơn Bán:</strong> ${d["don_hang_mat_hang"].toLocaleString()}<br>
                    <strong>Xác suất Bán / Nhóm hàng:</strong> ${(d["Xác suất bán"] * 100).toFixed(0)}%
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
                const isActive = d3.select(this).attr("opacity") === "0.3";
                if (isActive) {
                    bars.attr("opacity", 1);
                } else {
                    bars.attr("opacity", 0.3);
                    d3.select(this).attr("opacity", 1);
                }
            });


        // Add labels to the bars
        groupChart.selectAll(".label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Xác suất bán"]) - 5)
            .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${(d["Xác suất bán"] * 100).toFixed(1)}%`)
            .style("font-size", "10px")
            .style("fill", "white")
            .style("text-anchor", "end");


        groupChart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `${(d * 100).toFixed(0)}%`).ticks(5))
            .style("font-size", "10px");


        groupChart.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "10px")
            .style("text-anchor", "end");


        groupChart.append("text")
            .attr("x", width / 2 - margin.left) // Đặt ở giữa theo chiều ngang
            .attr("y", -5) // Đặt lên trên một chút
            .attr("text-anchor", "middle") // Căn giữa
            .attr("font-size", "13px")
            .attr("font-weight", "bold")
            .text(group);


    });
});

