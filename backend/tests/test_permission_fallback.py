from types import SimpleNamespace

from app.core.permissions import get_user_permissions, user_has_any_permission, user_has_permission


def test_get_user_permissions_falls_back_to_canonical_role_matrix():
    user = SimpleNamespace(
        roles=[SimpleNamespace(name="Accountant", permissions=[])],
    )

    perms = get_user_permissions(user)

    assert "procurement" in perms
    assert "accounts" in perms
    assert "inventory" in perms
    assert "analytics" in perms
    assert "alerts" in perms


def test_accountant_permission_includes_procurement_and_inventory():
    user_custom = SimpleNamespace(
        roles=[SimpleNamespace(name="Accountant", permissions=["accounts"])],
    )

    perms_custom = get_user_permissions(user_custom)
    assert "accounts" in perms_custom
    assert user_has_permission(user_custom, "accounts")
    assert user_has_any_permission(user_custom, "inventory", "procurement", "accounts")

    user_default = SimpleNamespace(
        roles=[SimpleNamespace(name="Accountant", permissions=[])],
    )
    perms_default = get_user_permissions(user_default)
    assert "accounts" in perms_default
    assert "procurement" in perms_default
    assert "inventory" in perms_default
    assert user_has_any_permission(user_default, "inventory", "procurement", "accounts")


