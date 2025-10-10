# list_files.py (VERSIÓN MEJORADA)
import os

# --- CONFIGURACIÓN ---
# Ruta base de tu proyecto
base_dir = r"D:\proyectos\AquaCleanCarWash"
# Archivo de salida, se creará en el mismo directorio
output_file = os.path.join(base_dir, "project-all-code-refactored.txt")

# --- LÍNEAS MODIFICADAS ---
# Extensiones de archivo a incluir (añadimos .prisma)
valid_extensions = (".ts", ".tsx", ".js", ".md", ".json", ".html", ".css", ".prisma")

# --- LÍNEAS AÑADIDAS ---
# Archivos específicos a incluir por su nombre exacto (ideal para 'dotfiles' o archivos sin extensión)
specific_files_to_include = {
    '.env', 
    '.env.example', 
    '.gitignore', 
    'turbo.json'
}

# --- LÍNEA MODIFICADA ---
# Carpetas a ignorar (añadimos .turbo y .next si existiera)
ignored_dirs = {'node_modules', '.git', '.vscode', 'dist', '__pycache__', '.turbo', '.next'}
# --- FIN CONFIGURACIÓN ---

def main():
    print(f"Iniciando escaneo de archivos en: {base_dir}")
    all_files = []
    
    for root, dirs, files in os.walk(base_dir, topdown=True):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            # --- LÓGICA MEJORADA ---
            # Incluimos un archivo si su extensión está en la lista O si su nombre está en la lista específica.
            if file.endswith(valid_extensions) or file in specific_files_to_include:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                all_files.append((full_path, rel_path.replace(os.path.sep, '/')))

    all_files.sort(key=lambda x: x[1])

    print(f"Se encontraron {len(all_files)} archivos válidos. Escribiendo en {output_file}...")
    
    try:
        with open(output_file, "w", encoding="utf-8") as outfile:
            outfile.write("# ÍNDICE DE ARCHIVOS (ESTRUCTURA REFACTORIZADA)\n\n")
            for idx, (_, rel_path) in enumerate(all_files, start=1):
                outfile.write(f"{idx}. {rel_path}\n")
            outfile.write("\n\n")
            
            outfile.write("# CONTENIDO DE ARCHIVOS\n\n")
            for idx, (full_path, rel_path) in enumerate(all_files, start=1):
                try:
                    with open(full_path, "r", encoding="utf-8", errors='ignore') as infile:
                        content = infile.read()
                    outfile.write(f"\n// ====== [{idx}] {rel_path} ======\n")
                    outfile.write(content)
                    outfile.write("\n\n")
                except Exception as e:
                    print(f"  ERROR al leer el archivo {full_path}: {e}")
                    outfile.write(f"\n// ====== [{idx}] {rel_path} (ERROR DE LECTURA) ======\n")
                    outfile.write(f"// No se pudo leer el archivo. Error: {e}\n\n")
                    
        print(f"¡Éxito! El archivo '{os.path.basename(output_file)}' ha sido creado.")
    except Exception as e:
        print(f"ERROR FATAL al escribir el archivo de salida: {e}")

if __name__ == "__main__":
    main()