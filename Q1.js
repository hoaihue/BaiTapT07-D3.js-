document.addEventListener("DOMContentLoaded", function () {
    // Chờ dữ liệu được load từ `data.js`
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    console.log("Dữ liệu đã load:", window.data);


    // Định nghĩa kích thước
    const margin = { top: 40, right: 200, bottom: 50, left: 250 }, // Tăng margin.right để tránh chồng chữ
        width = 700,
        height = 400;


    // Chuyển đổi dữ liệu
    const data1 = window.data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));


    // Tổng hợp dữ liệu theo "Mặt hàng"
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


    // Sắp xếp dữ liệu giảm dần
    aggregatedData.sort((a, b) => b["Thành tiền"] - a["Thành tiền"]);


    // Tạo SVG
    const svg = d3.select("#Q1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // Thang đo
    const x = d3.scaleLinear()
        .domain([0, 700_000_000]) // Giới hạn trục x tới 700M
        .range([0, width]);


    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Mặt hàng"]))
        .range([0, height])
        .padding(0.2);


    // Tạo màu sắc cho các nhóm hàng
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    // Vẽ cột
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
            // Hiển thị tooltip
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
            // Ẩn tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            // Nhấp chuột một lần: làm nhạt các thanh khác
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3); // Làm nhạt tất cả các thanh
                d3.select(this).attr("opacity", 1); // Giữ nguyên màu của thanh được chọn
            } else {
                // Nhấp chuột hai lần: trở về trạng thái ban đầu
                bars.attr("opacity", 1); // Khôi phục màu sắc ban đầu
            }
        });


    // Nhãn số liệu trên cột
    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Thành tiền"]) + 5) // Điều chỉnh vị trí nhãn
        .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`) // Làm tròn không có số thập phân
        .style("font-size", "11px");


    // Trục X với định dạng 100M, 200M
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`) // 100M, 200M
            .ticks(7) // Số lượng tick
        )
        .style("font-size", "11px");


    // Trục Y
    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text") // Chỉnh font size
        .style("font-size", "11px")
        .style("text-anchor", "end");


    // Thêm filter cho nhóm hàng
    const filter = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 30},${margin.top})`); // Điều chỉnh vị trí filter


    const filterRects = filter.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale)
        .on("click", function (event, selectedGroup) {
            // Nhấp chuột một lần: làm nhạt các mặt hàng không thuộc nhóm hàng được chọn
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3); // Làm nhạt tất cả các thanh
                bars.filter(d => d["Nhóm hàng"] === selectedGroup).attr("opacity", 1); // Giữ nguyên màu của các mặt hàng thuộc nhóm hàng được chọn
            } else {
                // Nhấp chuột hai lần: trở về trạng thái ban đầu
                bars.attr("opacity", 1); // Khôi phục màu sắc ban đầu
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


    // Tạo tooltip
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

