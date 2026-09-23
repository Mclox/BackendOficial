const fs = require('fs');

console.log('=== APLICANDO CAMBIOS EN FRONTEND WEB Y FLUTTER ===');

// 1. barbersiteweb-2 / src / lib / api.ts
const apiPath = 'C:\\Users\\DELL\\Documents\\barbersiteweb-2\\src\\lib\\api.ts';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  if (!content.includes('resolveAvatarUrl')) {
    content += `

export const resolveAvatarUrl = (avatarUrl?: string | null): string | undefined => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
  if (avatarUrl.startsWith('data:image/')) return avatarUrl;

  let cleanPath = avatarUrl.replace(/\\\\/g, '/');
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  let serverUrl = API_BASE_URL.replace(/\\/api\\/?$/, '');
  if (serverUrl.endsWith('/')) {
    serverUrl = serverUrl.substring(0, serverUrl.length - 1);
  }

  return \`\${serverUrl}/\${cleanPath}\`;
};
`;
    fs.writeFileSync(apiPath, content, 'utf8');
    console.log('✓ Actualizado: barbersiteweb-2/src/lib/api.ts');
  }
}

// 2. barbersiteweb-2 / src / features / auth / contexts / AuthProvider.tsx
const authProviderPath = 'C:\\Users\\DELL\\Documents\\barbersiteweb-2\\src\\features\\auth\\contexts\\AuthProvider.tsx';
if (fs.existsSync(authProviderPath)) {
  let content = fs.readFileSync(authProviderPath, 'utf8');

  content = content.replace(
    /if \(response\.success && response\.user\) \{\s*setUser\(response\.user\);\s*setRoleName\(response\.user\.rol \|\| response\.user\.rol_nombre \|\| null\);\s*localStorage\.setItem\('user', JSON\.stringify\(response\.user\)\);/g,
    `if (response.success && response.user) {
          const normalized = { ...response.user, avatar: response.user.img || response.user.avatar, img: response.user.img || response.user.avatar };
          setUser(normalized);
          setRoleName(normalized.rol || normalized.rol_nombre || null);
          localStorage.setItem('user', JSON.stringify(normalized));`
  );

  content = content.replace(
    /if \(response\.success && response\.user\) \{\s*setUser\(response\.user\);\s*setRoleName\(response\.user\.rol \|\| response\.user\.rol_nombre \|\| null\);\s*localStorage\.setItem\('user', JSON\.stringify\(response\.user\)\);\s*\}/g,
    `if (response.success && response.user) {
        const normalized = { ...response.user, avatar: response.user.img || response.user.avatar, img: response.user.img || response.user.avatar };
        setUser(normalized);
        setRoleName(normalized.rol || normalized.rol_nombre || null);
        localStorage.setItem('user', JSON.stringify(normalized));
      }`
  );

  content = content.replace(
    /setUser\(userToSave\);\s*setRoleName\(userToSave\.rol \|\| userToSave\.rol_nombre\);\s*localStorage\.setItem\('token', token\);\s*localStorage\.setItem\('user', JSON\.stringify\(userToSave\)\);/g,
    `const normalized = { ...userToSave, avatar: userToSave.img || userToSave.avatar, img: userToSave.img || userToSave.avatar };
        setUser(normalized);
        setRoleName(normalized.rol || normalized.rol_nombre);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalized));`
  );

  const oldUpdate = `  const updateUser = useCallback((updatedData: Partial<Usuario>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);`;

  const newUpdate = `  const updateUser = useCallback(async (updatedData: Partial<Usuario>) => {
    let currentUserId: any = null;
    setUser((prevUser) => {
      if (!prevUser) return null;
      currentUserId = (prevUser as any).id_usuario || (prevUser as any).id;
      const newUser = {
        ...prevUser,
        ...updatedData,
        avatar: updatedData.avatar || updatedData.img || prevUser.avatar || prevUser.img,
        img: updatedData.img || updatedData.avatar || prevUser.img || prevUser.avatar,
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });

    if (currentUserId) {
      try {
        const payload: any = { ...updatedData };
        if (updatedData.avatar) payload.avatar = updatedData.avatar;
        if (updatedData.img) payload.img = updatedData.img;
        await fetchApi(\`/users/\${currentUserId}\`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        refetchProfile();
      } catch (err) {
        console.error('Error enviando actualizacion de usuario al backend:', err);
      }
    }
  }, [refetchProfile]);`;

  if (content.includes(oldUpdate)) {
    content = content.replace(oldUpdate, newUpdate);
  }

  fs.writeFileSync(authProviderPath, content, 'utf8');
  console.log('✓ Actualizado: barbersiteweb-2/src/features/auth/contexts/AuthProvider.tsx');
}

// 3. barbersiteweb-2 / src / features / mi-perfil / components / MiPerfilView.tsx
const miPerfilPath = 'C:\\Users\\DELL\\Documents\\barbersiteweb-2\\src\\features\\mi-perfil\\components\\MiPerfilView.tsx';
if (fs.existsSync(miPerfilPath)) {
  let content = fs.readFileSync(miPerfilPath, 'utf8');

  if (!content.includes('resolveAvatarUrl')) {
    content = content.replace(
      "import { fetchApi } from '../../../lib/api';",
      "import { fetchApi, resolveAvatarUrl } from '../../../lib/api';"
    );
  }

  content = content.replace(
    '<AvatarImage src={user?.avatar} className="object-cover" />',
    '<AvatarImage src={resolveAvatarUrl(user?.img || user?.avatar)} className="object-cover" />'
  );

  fs.writeFileSync(miPerfilPath, content, 'utf8');
  console.log('✓ Actualizado: barbersiteweb-2 MiPerfilView.tsx');
}

// 4. barbersiteweb-2 / src / core / layout / MainLayoutPorProcesos.tsx
const layoutPath = 'C:\\Users\\DELL\\Documents\\barbersiteweb-2\\src\\core\\layout\\MainLayoutPorProcesos.tsx';
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');

  if (!content.includes('resolveAvatarUrl')) {
    content = content.replace(
      "import { fetchApi } from '../../lib/api';",
      "import { fetchApi, resolveAvatarUrl } from '../../lib/api';"
    );
  }

  content = content.replace(
    '<img src={currentUser.avatar} alt={currentUser.nombre} className="w-full h-full object-cover" />',
    '<img src={resolveAvatarUrl(currentUser.img || currentUser.avatar)} alt={currentUser.nombre} className="w-full h-full object-cover" />'
  );

  content = content.replace(
    '<AvatarImage src={user.avatar} className="object-cover" />',
    '<AvatarImage src={resolveAvatarUrl(user.img || user.avatar)} className="object-cover" />'
  );

  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log('✓ Actualizado: barbersiteweb-2 MainLayoutPorProcesos.tsx');
}

// 5. barbermovil / lib / providers / auth_provider.dart
const flutterAuthProviderPath = 'C:\\Users\\DELL\\Desktop\\mobil2\\barbermovil\\lib\\providers\\auth_provider.dart';
if (fs.existsSync(flutterAuthProviderPath)) {
  let content = fs.readFileSync(flutterAuthProviderPath, 'utf8');

  const oldReload = `        final localSavedAvatar = prefs.getString('user_avatar_$userId');
        if ((updatedUser.avatarUrl == null || updatedUser.avatarUrl!.isEmpty) && localSavedAvatar != null && localSavedAvatar.isNotEmpty) {
          _user = User(
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            password: updatedUser.password,
            role: updatedUser.role,
            avatarUrl: localSavedAvatar,
            document: updatedUser.document,
            documentType: updatedUser.documentType,
            phone: updatedUser.phone,
            address: updatedUser.address,
            state: updatedUser.state,
            roleId: updatedUser.roleId,
          );
        } else {
          _user = updatedUser;
        }`;

  const newReload = `        if (updatedUser.avatarUrl != null && updatedUser.avatarUrl!.isNotEmpty) {
          _user = updatedUser;
          await prefs.setString('user_avatar_$userId', updatedUser.avatarUrl!);
        } else {
          final localSavedAvatar = prefs.getString('user_avatar_$userId');
          if (localSavedAvatar != null && localSavedAvatar.isNotEmpty) {
            _user = User(
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              password: updatedUser.password,
              role: updatedUser.role,
              avatarUrl: localSavedAvatar,
              document: updatedUser.document,
              documentType: updatedUser.documentType,
              phone: updatedUser.phone,
              address: updatedUser.address,
              state: updatedUser.state,
              roleId: updatedUser.roleId,
            );
          } else {
            _user = updatedUser;
          }
        }`;

  if (content.includes(oldReload)) {
    content = content.replace(oldReload, newReload);
    fs.writeFileSync(flutterAuthProviderPath, content, 'utf8');
    console.log('✓ Actualizado: barbermovil auth_provider.dart');
  }
}

// 6. barbermovil / lib / widgets / profile_tab_widget.dart
const flutterProfileTabPath = 'C:\\Users\\DELL\\Desktop\\mobil2\\barbermovil\\lib\\widgets\\profile_tab_widget.dart';
if (fs.existsSync(flutterProfileTabPath)) {
  let content = fs.readFileSync(flutterProfileTabPath, 'utf8');

  const oldGetImage = `  ImageProvider? _getImageProvider(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('data:image')) {
      try {
        final base64Str = url.split(',').last;
        return MemoryImage(base64Decode(base64Str));
      } catch (e) {
        print("Error al decodificar avatar en base64: $e");
        return null;
      }
    }
    return NetworkImage(url);
  }`;

  const newGetImage = `  ImageProvider? _getImageProvider(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('data:image')) {
      try {
        final base64Str = url.split(',').last;
        return MemoryImage(base64Decode(base64Str));
      } catch (e) {
        print("Error al decodificar avatar en base64: $e");
        return null;
      }
    }
    final cacheBustUrl = url.contains('?') 
        ? '$url&t=\${DateTime.now().millisecondsSinceEpoch}' 
        : '$url?t=\${DateTime.now().millisecondsSinceEpoch}';
    return NetworkImage(cacheBustUrl);
  }`;

  if (content.includes(oldGetImage)) {
    content = content.replace(oldGetImage, newGetImage);
    fs.writeFileSync(flutterProfileTabPath, content, 'utf8');
    console.log('✓ Actualizado: barbermovil profile_tab_widget.dart');
  }
}

console.log('=== PROCESO FINALIZADO EXITOSAMENTE ===');
