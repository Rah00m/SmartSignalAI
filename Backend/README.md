Backend README
==============
1. Install dependencies:
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

2. Download CHB-MIT samples:
   python download_chbmit.py --subject chb01

3. Preprocess & epoch:
   python preprocess_and_epoch.py --subject chb01 --edf_dir data --out_dir dataset_out --epoch_sec 10 --overlap 0.5 --max_files 6

4. Train (optional: requires TensorFlow):
   python train_and_save_model.py --data_dir dataset_out --epochs 15

5. Run server:
   python app.py
   -> API endpoints:
      GET /api/health
      POST /api/predict  (payload described in app.py)