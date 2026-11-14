"""Download público dos pesos usados pelo preset leve, sem tokens/cookies."""
from pathlib import Path
import hashlib
import json
import shutil
from huggingface_hub import HfApi, hf_hub_download

ROOT = Path(__file__).resolve().parents[3]
TARGET = ROOT / "vendor/wan2gp/ckpts"
SOURCES = [
    ("MDMNexus/Nexus.v1", "a88279f46c5440ff191351ab6b593d6adb1cab35", [
        "wan2.1_t2v_1.3b.nexus.B-SMOOTHED.build.1.safetensors"]),
    ("DeepBeepMeep/Wan2.1", "176bbae94db7b26f00e5b698d95d4f578debc51c", [
        "wan2.1_Fun_InP_1.3B_bf16.safetensors",
        "umt5-xxl/models_t5_umt5-xxl-enc-quanto_int8.safetensors",
        "umt5-xxl/special_tokens_map.json", "umt5-xxl/spiece.model",
        "umt5-xxl/tokenizer.json", "umt5-xxl/tokenizer_config.json",
        "xlm-roberta-large/models_clip_open-clip-xlm-roberta-large-vit-huge-14-bf16.safetensors",
        "xlm-roberta-large/sentencepiece.bpe.model", "xlm-roberta-large/special_tokens_map.json",
        "xlm-roberta-large/tokenizer.json", "xlm-roberta-large/tokenizer_config.json",
        "Wan2.1_VAE.safetensors", "Wan2.1_VAE_upscale2x_imageonly_real_v1.safetensors"]),
]

def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    api = HfApi(token=False)
    downloads = []
    for repo, revision, names in SOURCES:
        info = api.model_info(repo, revision=revision, files_metadata=True)
        files = {f.rfilename: f for f in info.siblings}
        for name in names:
            f = files[name]
            downloads.append((repo, revision, name, f.size, f.lfs.sha256 if f.lfs else None))
    missing = sum(size for _, _, name, size, _ in downloads
                  if not (TARGET / name).is_file() or (TARGET / name).stat().st_size != size)
    if shutil.disk_usage(TARGET).free < missing + 5 * 1024**3:
        raise RuntimeError("Espaço insuficiente para os pesos e 5 GiB de reserva.")
    manifest = {"schemaVersion": 1, "status": "downloading", "files": []}
    manifest_path = ROOT / "kit/integrations/wan2gp/models.lock.json"
    for repo, revision, name, size, expected in downloads:
        print(f"Downloading {repo}/{name} ({size / 1024**3:.2f} GiB)", flush=True)
        p = Path(hf_hub_download(repo, name, revision=revision, local_dir=TARGET, token=False))
        digest = hashlib.sha256()
        with p.open("rb") as stream:
            for chunk in iter(lambda: stream.read(8 * 1024**2), b""):
                digest.update(chunk)
        sha = digest.hexdigest()
        if p.stat().st_size != size or (expected and sha != expected):
            raise RuntimeError(f"Integridade inválida: {p}")
        manifest["files"].append({"repo": repo, "revision": revision, "file": name,
                                  "size": size, "sha256": sha})
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    manifest["status"] = "downloaded-and-verified"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

if __name__ == "__main__":
    main()
