# NeuroCine ComfyUI Workflows

Put exported ComfyUI **API format** workflows here.

Recommended production files:

- `z_image_turbo_api.json`
- `flux_2_klein_api.json`
- `wan_image_api.json`

You can also point to any file with:

```powershell
$env:COMFYUI_WORKFLOW_PATH="C:\path\to\your\workflow_api.json"
```

Workflow placeholders supported by the backend:

```text
__PROMPT__
__NEGATIVE__
__WIDTH__
__HEIGHT__
__STEPS__
__CFG__
__SEED__
__CHECKPOINT__
__FILENAME_PREFIX__
```

The factory checks the workflow before rendering:

- ComfyUI API must answer on `COMFYUI_URL`.
- Workflow JSON file must exist.
- All workflow `class_type` nodes must exist in ComfyUI `/object_info`.
- Model filenames referenced in the workflow must be visible in ComfyUI node model lists.

The built-in `basic_sdxl_diagnostic` preset is only for connection testing, not final production quality.
