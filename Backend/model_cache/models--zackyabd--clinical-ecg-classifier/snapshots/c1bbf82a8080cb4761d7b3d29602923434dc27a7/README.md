# Clinical ECG Classifier

A multi-branch deep learning model for automated ECG classification and clinical interpretation.

## Model Description

This is a PyTorch-based ECG classification model that uses a multi-branch architecture combining:

- **Rhythm Branch**: 1D ResNet for temporal rhythm analysis
- **Morphology Branch**: 2D CNN for local morphology patterns
- **Global Branch**: 2D CNN for global ECG interpretation

The model is trained to classify 71 different ECG conditions including arrhythmias, conduction disorders, ischemia, myocardial infarction, and hypertrophy patterns.

## Performance

- **Macro AUC**: 0.9424
- **F-max Score**: 0.7573
- **Training Dataset**: PTB-XL (21,799 ECGs)
- **Test Performance**: Evaluated on 2,198 test samples

## Model Architecture

The model combines three specialized branches:

1. **Rhythm Branch** (1D ResNet): Analyzes temporal patterns for rhythm detection
2. **Morphology Branch** (2D CNN): Focuses on local morphological features
3. **Global Branch** (2D CNN): Captures global ECG patterns

All branches are fused through a final classifier with dropout regularization.

## Input Format

- **Input Shape**: [batch_size, 12, 1000]
- **Sampling Rate**: 100 Hz
- **Duration**: 10 seconds
- **Leads**: Standard 12-lead ECG (I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6)

## Supported Conditions

The model can classify 71 different ECG conditions including:

### Rhythm Abnormalities
- Atrial Fibrillation (AFIB)
- Atrial Flutter (AFL)
- Sinus Tachycardia (STACH)
- Sinus Bradycardia (SBRAD)
- Premature Ventricular Contractions (PVC)
- Ventricular Tachycardia (VTAC)

### Conduction Disorders
- Bundle Branch Blocks (LBBB, RBBB)
- AV Blocks (1st, 2nd, 3rd degree)
- Fascicular Blocks (LAFB, LPFB)

### Ischemia & Infarction
- ST-T Changes (STTC)
- Myocardial Infarction patterns (AMI, IMI, LMI)
- Ischemia patterns (ISCAN, ISCIN, ISCLA)

### Hypertrophy
- Left Ventricular Hypertrophy (LVH)
- Right Ventricular Hypertrophy (RVH)
- Atrial Enlargement (LAE, RAE)

## Usage

```python
import torch
import numpy as np

# Load the model
model = torch.load('ecg_model.pth', map_location='cpu')
model.eval()

# Prepare ECG data (12 leads, 1000 samples)
ecg_data = np.random.randn(1, 12, 1000)  # Replace with actual ECG data
ecg_tensor = torch.tensor(ecg_data, dtype=torch.float32)

# Make prediction
with torch.no_grad():
    logits = model(ecg_tensor)
    probabilities = torch.sigmoid(logits)
    
# Get top predictions
top_indices = torch.topk(probabilities, k=5).indices[0]
```

## Clinical Applications

This model can assist healthcare professionals in:

- **Automated ECG Screening**: Rapid identification of abnormal ECGs
- **Clinical Decision Support**: Highlighting potential cardiac conditions
- **Educational Tool**: Teaching ECG interpretation patterns
- **Research**: Large-scale ECG analysis for epidemiological studies

## Limitations

- Model trained on PTB-XL dataset - performance may vary on other populations
- Not a replacement for clinical judgment
- Requires standard 12-lead ECG format
- Should be used as a supportive tool alongside clinical assessment

## Technical Details

- **Framework**: PyTorch
- **Model Size**: ~166MB
- **Training**: 25 epochs with AdamW optimizer
- **Regularization**: Dropout, batch normalization
- **Loss Function**: Binary cross-entropy with logits

## Citation

If you use this model in your research, please cite:

```bibtex
@misc{clinical-ecg-classifier,
  title={Clinical ECG Classifier: Multi-branch Deep Learning for ECG Analysis},
  author={[Abdul Zacky, Irma Nia Alwijah, Muttaqin Muzakkir]},
  year={2024},
  url={https://huggingface.co/clinical-ecg-classifier}
}
```

## License

This model is provided for research and educational purposes. Please ensure compliance with applicable medical device regulations before clinical use.

## Contact

For questions or issues, please contact: zacxvan@gmail.com