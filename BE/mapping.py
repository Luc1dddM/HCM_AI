import os
import json
import re

def update_mapping(root, json_path="mapping.json"):
    # nếu file JSON đã tồn tại → load, ngược lại tạo dict rỗng
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            output = json.load(f)
    else:
        output = {}

    # tìm chỉ số index lớn nhất hiện tại
    if output:
        idx = max(int(k) for k in output.keys()) + 1
    else:
        idx = 0

    for folder in sorted(os.listdir(root)):
        if not folder.startswith("L"):
            continue

        match = re.match(r"L(\d+)_V(\d+)", folder)
        if not match:
            continue

        L_num, V_num = match.groups()
        L_num, V_num = int(L_num), int(V_num)

        folder_path = os.path.join(root, folder)
        for file in sorted(os.listdir(folder_path)):
            if not (file.endswith(".jpg") or file.endswith(".png")):
                continue

            # lấy số trong tên file
            file_num = os.path.splitext(file)[0]
            try:
                file_num = int(file_num)
            except ValueError:
                continue

            output[str(idx)] = f"{L_num}/{V_num}/{file_num}"
            idx += 1

    # ghi lại JSON
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)

# ví dụ chạy cho folder mới
update_mapping("/home/lam/Downloads/archive/AIC25-Batch1/Keyframes_L22/keyframes", "mapping.json")
