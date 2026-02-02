# Release Process Guide

## Quy trình release tự động

### 1. Cập nhật version

Cập nhật version trong 2 file:
- `manifest.json`: Cập nhật field `version`
- `package.json`: Cập nhật field `version`

### 2. Commit và push

```bash
git add .
git commit -m "chore: release v1.x.x"
git push origin main
```

### 3. Tạo tag và push

```bash
git tag v1.x.x
git push origin v1.x.x
```

### 4. Tự động build và release

GitHub Actions sẽ tự động:
- Build extension thành file zip
- Tạo GitHub release
- Đính kèm file zip vào release

### Build manual (local testing)

Nếu muốn build manual để test:

```bash
npm run build
# hoặc
./build.sh
```

File zip sẽ được tạo: `hrm-auto-extension-vX.X.X.zip`

## Files quan trọng

- `.github/workflows/release.yml`: GitHub Actions workflow tự động release
- `build.sh`: Script build extension zip
- `manifest.json`: Extension manifest (chứa version)
- `package.json`: Package info (chứa version)

## Cài đặt extension từ release

1. Vào [Releases page](https://github.com/luan-thnh/hrm-auto-extension/releases)
2. Tải file `hrm-auto-extension-vX.X.X.zip` từ release mới nhất
3. Giải nén file zip
4. Mở Chrome/Edge, vào `chrome://extensions/`
5. Bật "Developer mode"
6. Chọn "Load unpacked" và chọn thư mục vừa giải nén
